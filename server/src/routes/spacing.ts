import express, { Request, Response, NextFunction } from "express";
const router = express.Router();
const esClient = require("../models/connection.ts");
import passport from "passport";
const index: String = "words";

router
  .route("/")
  .get(async (req: Request, res: Response, next: NextFunction) => {
    let { sort, page } = req.query;

    let from: number = 0;
    if (typeof page == "string") {
      from = (parseInt(page) - 1) * 10;
    }

    if (sort) {
      // 띄어쓰기 게시판 조회
      try {
        const result = await esClient.search({
          index: index,
          sort: [`${sort}:desc`],
          body: {
            _source: ["title", "hits", "scraps", "created_at"],
            size: "10",
            from: from,
            query: {
              match: {
                type: "spacing",
              },
            },
          },
        });
        // 전체 페이지 개수
        const count = await esClient.count({
          index: index,
          body: {
            query: {
              match: {
                type: "spacing",
              },
            },
          },
        });

        const page_count: number = Math.ceil(count.body.count / 10);
        const result_data: Array<JSON> = result.body.hits.hits;
        const current_page: number = from / 10 + 1;
        return res.status(200).json({
          total_page: page_count,
          current_page: current_page,
          result: result_data,
        });
      } catch (err) {
        console.error(err);
        next(err);
      }
    } else {
      // 메인 페이지 요청
      try {
        const sort_hits_result = await esClient.search({
          index: index,
          body: {
            _source: ["title", "hits", "created_at"],
            sort: { hits: "desc" },
            size: "3",
            query: {
              match: {
                type: "spacing",
              },
            },
          },
        });
        const sort_crt_result = await esClient.search({
          index: index,
          body: {
            _source: ["title", "hits", "created_at"],
            sort: { created_at: "desc" },
            size: "3",
            query: {
              match: {
                type: "spacing",
              },
            },
          },
        });
        const hits: Array<JSON> = sort_hits_result.body.hits.hits;
        const crt: Array<JSON> = sort_crt_result.body.hits.hits;

        return res
          .status(200)
          .json({ hits_order: hits, created_at_order: crt });
      } catch (err) {
        console.error(err);
        next(err);
      }
    }
  })
  // 띄어쓰기 정보글 등록
  .post(
    passport.authenticate("jwt", { session: false }),
    async (req: Request, res: Response, next: NextFunction) => {
      //console.log(req.user);
      if (req.user?._source.is_admin === false) {
        return res.status(400).send("잘못된 접근입니다.");
      }
      try {
        const result = await esClient.index({
          index: index,
          body: {
            type: "spacing",
            title: req.body.title,
            right_words: req.body.right_words,
            wrong_words: req.body.wrong_words,
            helpful_info: req.body.helpful_info,
            created_at: new Date(
              +new Date() + 9 * 60 * 60 * 1000
            ).toISOString(),
          },
        });
        return res.status(201).json(result.body);
      } catch (err) {
        console.error(err);
        next(err);
      }
    }
  );

router
  .route("/:id")
  .get(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await esClient.search({
        index: index,
        body: {
          query: {
            bool: {
              must: [
                { match: { type: "spacing" } },
                { match: { _id: req.params.id } },
              ],
            },
          },
        },
      });
      let related = await esClient.search({
        index: index,
        body: {
          query: {
            bool: {
              must: [
                {
                  multi_match: {
                    query: result.body.hits.hits[0]._source.right_words,
                    fields: ["right_words", "wrong_words"],
                  },
                },
              ],
              must_not: [
                {
                  match: {
                    _id: result.body.hits.hits[0]._id,
                  },
                },
              ],
            },
          },
        },
      });
      if (related.body.hits.total.value == 0) {
        related = { id: "", title: "" };
      } else {
        related = {
          id: related.body.hits.hits[0]._id,
          title: related.body.hits.hits[0]._source.title,
        };
      }
      let hits = result.body.hits.hits[0]._source.hits;
      hits++;
      const count_hits = await esClient.update({
        index: index,
        id: req.params.id,
        body: {
          doc: {
            hits: hits,
            related: related,
          },
        },
      });
      return res.status(200).json(result.body.hits.hits[0]._source);
    } catch (err) {
      console.error(err);
      next(err);
    }
  })
  // 철자 정보글 수정
  .put(
    passport.authenticate("jwt", { session: false }),
    async (req: Request, res: Response, next: NextFunction) => {
      if (req.user?._source.is_admin === false) {
        return res.status(400).send("잘못된 접근입니다.");
      }
      try {
        const result = await esClient.update({
          index: index,
          id: req.params.id,
          body: {
            doc: {
              title: req.body.title,
              right_words: req.body.right_words,
              wrong_words: req.body.wrong_words,
              helpful_info: req.body.helpful_info,
            },
          },
        });
        return res.status(200).json(result.body);
      } catch (err) {
        console.error(err);
        next(err);
      }
    }
  )
  // 철자 정보글 삭제
  .delete(
    passport.authenticate("jwt", { session: false }),
    async (req: Request, res: Response, next: NextFunction) => {
      if (req.user?._source.is_admin === false) {
        return res.status(400).send("잘못된 접근입니다.");
      }
      try {
        const result = await esClient.delete({
          index: index,
          id: req.params.id,
        });
        return res.status(204).send("삭제되었습니다.");
      } catch (err) {
        console.error(err);
        next(err);
      }
    }
  );

router
  .route("/:id/scraps")
  .put(
    passport.authenticate("jwt", { session: false }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user_result = await esClient.search({
          index: "users",
          body: {
            query: {
              bool: {
                must: [{ match: { _id: req.user?._id } }],
              },
            },
          },
        });

        const get_title = await esClient.search({
          index: index,
          body: {
            query: {
              bool: {
                must: [{ match: { _id: req.params.id } }],
              },
            },
          },
        });

        const title: string = get_title.body.hits.hits[0]._source.title;
        let new_scraps = [];
        const id: string = req.params.id;

        // 기존에 스크랩 했던 게 있으면 추가
        if (user_result.body.hits.hits[0]._source.scraps?.spacing) {
          new_scraps = user_result.body.hits.hits[0]._source.scraps.spacing;
          if (
            // 이미 스크랩한 글이면
            new_scraps.some((item: any) => item.id === req.params.id)
          ) {
            res.status(400).send("이미 스크랩한 글입니다.");
          } else {
            new_scraps.push({ id: req.params.id, title: title });
          }
        } else {
          // 첫 스크랩이면
          new_scraps = [{ id: req.params.id, title: title }];
        }
        const user_scrap = esClient.update({
          index: "users",
          id: req.user?._id,
          body: {
            doc: {
              scraps: { spacing: new_scraps },
            },
          },
        });

        // 스크랩 수 설정
        const result = await esClient.search({
          index: index,
          body: {
            query: {
              bool: {
                must: [
                  { match: { type: "spacing" } },
                  { match: { _id: req.params.id } },
                ],
              },
            },
          },
        });
        let scraps = result.body.hits.hits[0]._source.scraps;
        scraps++;
        const count_hits = await esClient.update({
          index: index,
          id: req.params.id,
          body: {
            doc: {
              scraps: scraps,
            },
          },
        });
        return res.status(200).json(result.body.hits.hits[0]._source);
      } catch (err) {
        console.error(err);
        next(err);
      }
    }
  );

module.exports = router;

/**
 * @swagger
 * paths:
 *  /api/spacings:
 *      get:
 *          tags: [spacing]
 *          summary: 띄어쓰기 정보 조회
 *          description: 띄어쓰기 정보 조회
 *          parameters:
 *          - in: query
 *            name: "sort"
 *            description: 정렬 방식을 입력하세요.(created_at / hits / scraps)
 *            required: false
 *            schema:
 *                type: string
 *                description: sort
 *          - in: query
 *            name: "page"
 *            description: 페이지를 입력하세요.
 *            required: false
 *            schema:
 *                type: string
 *                description: 페이지
 *          produces:
 *          - application/json
 *          responses:
 *              200:
 *                  description: 띄어쓰기 정보 조회 성공
 *      post:
 *          tags: [spacing]
 *          summary: 띄어쓰기 정보 등록
 *          description: 띄어쓰기 정보 등록
 *          parameters:
 *          - in: body
 *            name: "req"
 *            description: title, right_words, wrong_words, helpful_info 를 작성하세요.
 *            required: true
 *            schema:
 *                type: string
 *                description: title, right_words, wrong_words, helpful_info
 *          produces:
 *          - application/json
 *          responses:
 *              200:
 *                  description: 띄어쓰기 정보 등록 성공
 *  /api/spacings/{id}:
 *      get:
 *          tags: [spacing]
 *          summary: 띄어쓰기 정보 세부 조회
 *          description: 띄어쓰기 정보 세부 조회
 *          parameters:
 *          - in: path
 *            name: "id"
 *            description: 게시글의 고유 아이디 값을 입력하세요.
 *            required: true
 *            schema:
 *                type: string
 *          produces:
 *          - application/json
 *          responses:
 *              200:
 *                  description: 띄어쓰기 정보 세부 조회 성공
 *      put:
 *          tags: [spacing]
 *          summary: 띄어쓰기 정보글 수정
 *          description: 띄어쓰기 정보글 수정
 *          parameters:
 *          - in: path
 *            name: "id"
 *            description: 게시글의 고유 아이디 값을 입력하세요.
 *            required: true
 *            schema:
 *                type: string
 *          - in: body
 *            name: "req"
 *            description: title, right_words, wrong_words, helpful_info 를 작성하세요.
 *            required: true
 *            schema:
 *                type: string
 *                description: title, right_words, wrong_words, helpful_info
 *          produces:
 *          - application/json
 *          responses:
 *              200:
 *                  description: 띄어쓰기 정보글 수정 성공
 *      delete:
 *          tags: [spacing]
 *          summary: 띄어쓰기 정보글 삭제
 *          description: 띄어쓰기 정보글 삭제
 *          parameters:
 *          - in: path
 *            name: "id"
 *            description: 게시글의 고유 아이디 값을 입력하세요.
 *            required: true
 *            schema:
 *                type: string
 *          produces:
 *          - application/json
 *          responses:
 *              200:
 *                  description: 띄어쓰기 정보글 삭제 성공
 *  /api/spacings/{id}/scraps:
 *      put:
 *          tags: [spacing]
 *          summary: 띄어쓰기 정보 보관
 *          description: 띄어쓰기 정보 보관
 *          parameters:
 *          - in: path
 *            name: "id"
 *            description: 게시글의 고유 아이디 값을 입력하세요.
 *            required: true
 *            schema:
 *                type: string
 *          produces:
 *          - application/json
 *          responses:
 *              200:
 *                  description: 띄어쓰기 정보 보관 성공
 */

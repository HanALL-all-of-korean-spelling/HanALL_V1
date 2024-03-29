import { Request } from "express";

const passport = require("passport");
const passportJWT = require("passport-jwt");
const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");
const esClient = require("../models/connection.ts");
require("dotenv").config();
const index: String = "users";

declare global {
  namespace Express {
    interface User {
      _id: string;
      _source: source;
    }
  }
}

declare global {
  namespace Express {
    interface source {
      email: string;
      nickname: string;
      password: string;
      scraps: scraps;
      rank: string;
      point: number;
      is_admin: boolean;
    }
  }
}

declare global {
  namespace Express {
    interface scraps {
      spelling: Array<JSON>;
      spacing: Array<JSON>;
    }
  }
}

const passportConfig = { usernameField: "email", passwordField: "password" };

const passportVerify = async (email: String, password: String, done: any) => {
  try {
    const exUser = await esClient.search({
      index: index,
      body: {
        query: {
          match: {
            email: email,
          },
        },
      },
    });
    const userData = exUser.body.hits.hits;
    if (userData.length > 0) {
      const result = await bcrypt.compare(
        password,
        userData[0]._source.password
      );
      if (result) {
        return done(null, exUser, { message: "Logged In Successfully" });
      } else {
        return done(null, false, { message: "비밀번호가 일치하지 않습니다." });
      }
    } else {
      return done(true, false, { message: "가입되지 않은 회원입니다." });
    }
  } catch (error) {
    console.error(error);
    done(error);
  }
};

const cookieExtractor = (req: Request) => {
  const { accesstoken } = req.cookies;
  return accesstoken;
};

const JWTConfig = {
  jwtFromRequest: cookieExtractor,
  secretOrKey: process.env.JWT_SECRET,
};

const JWTVerify = async (jwtPayload: any, done: any) => {
  try {
    // payload의 id값으로 유저의 데이터 조회
    const user = await esClient.search({
      index: index,
      body: {
        query: {
          match: {
            _id: jwtPayload.id,
          },
        },
      },
    });
    // 유저 데이터가 있다면 유저 데이터 전송
    console.log("user:", user.body.hits.hits[0]._source.email);
    let is_admin: boolean = false;
    if (user) {
      if (user.body.hits.hits[0]._source.email === process.env.ADMIN_EMAIL) {
        is_admin = true;
      }
      user.body.hits.hits[0]._source.is_admin = is_admin;
      done(null, user.body.hits.hits[0]);
      return;
    }
    // 유저 데이터가 없을 경우 에러 표시
    done(null, false, { reason: "올바르지 않은 인증정보 입니다." });
    return;
  } catch (error) {
    console.error(error);
    done(error);
  }
};

const passportLocal = () => {
  passport.use("local", new LocalStrategy(passportConfig, passportVerify));
  passport.use("jwt", new JWTStrategy(JWTConfig, JWTVerify));
};

export { passportLocal };

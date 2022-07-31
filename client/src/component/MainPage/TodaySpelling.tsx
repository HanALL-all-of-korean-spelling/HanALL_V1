import Link from "next/link";
import React, { useState, useEffect } from "react";
import { IToday } from "../../../types";
import { getTodayInfo } from "../../services/user-service";
import { Button } from "../Button/Button";
import { OutlineBox } from "../OutlineBox/OutlineBox";
import { Title } from "../Title/Title";
import style from "./MainPage.module.scss";

export const TodaySpelling = () => {
  const [todayInfo, setTodayInfo] = useState<IToday>();

  const getData = async () => {
    const info = await getTodayInfo();
    setTodayInfo(info);
  };

  useEffect(() => {
    getData();
  }, []);

  return (
    <div>
      {todayInfo && (
        <OutlineBox>
          <div className={style.TodaySpelling}>
            <Title color="black">오늘의 맞춤법</Title>
            <Link href="/detail/[id]" as={`/detail/${todayInfo._id}`} passHref>
              <Title size="mid">{todayInfo._source.title}</Title>
            </Link>
            <div>
              <div>😄 옳은 표현: {todayInfo._source.right_words}</div>
              <div>{todayInfo._source.description}</div>
              <div>{todayInfo._source.helpful_info}</div>
              {todayInfo._source.related?.id && (
                <Link
                  href="/detail/[id]/"
                  as={`/detail/${todayInfo._source.related?.id}`}
                  passHref
                >
                  <Button color="white" outline shadow>
                    <div>친구</div>
                    <Title size="small" color="blue" normal>
                      {todayInfo._source.related.title}
                    </Title>
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </OutlineBox>
      )}
    </div>
  );
};

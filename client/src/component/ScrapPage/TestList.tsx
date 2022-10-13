import React, { useState } from "react";
import { ITest } from "../../../types";
import { putTestResult } from "../../services/auth-service";
import { useAppDispatch } from "../../_app/hooks";
import { setTotalScore } from "../../_reducer/testReducer";
import { setUserScore } from "../../_reducer/userReducer";
import { Title } from "../common/Title/Title";
import { Button } from "../common/Button/Button";
import css from "styled-jsx/css";

export const TestList = ({ quizzes }: { quizzes: ITest[] }) => {
  const dispatch = useAppDispatch();

  const [checkedList, setCheckedList] = useState<Array<string | string[]>>([]);
  const [score, setScore] = useState<number>(0);

  // 클릭한 버튼 정보 저장
  const onClickCheck = (name: string | string[], isRight: boolean) => {
    // 배열에 없으면 (처음 클릭하는 거면) 넣기, 정답이면 +1
    if (!checkedList.includes(name)) {
      setCheckedList([...checkedList, name]);
      if (isRight) setScore(score + 1);
    } else {
      // 다시 클릭하는 거면 빼기, 정답이면 취소니까 -1
      setCheckedList(checkedList.filter((answer) => answer !== name));
      if (isRight) setScore(score - 1);
    }
  };

  const AnswerButton = (name: string | string[], isRight: boolean) => {
    return (
      <Button
        fullWidth
        outline
        color={checkedList.includes(name) ? "lightPink" : "white"}
        shadow
        onClick={() => onClickCheck(name, isRight)}
      >
        {name}
      </Button>
    );
  };

  const renderTestList =
    quizzes &&
    quizzes.map((quiz) => {
      return (
        <div key={quiz._id}>
          <style jsx>{style}</style>
          <Title color="black">다음 중 옳은 표현을 고르세요.</Title>
          {AnswerButton(quiz._source.right_words, true)}
          {AnswerButton(quiz._source.wrong_words, false)}
        </div>
      );
    });

  // 점수 보기 버튼 클릭
  const onClickResult = async () => {
    dispatch(setTotalScore(score));
    dispatch(setUserScore(score));
    await putTestResult(score);
  };

  return (
    <>
      <div>{renderTestList}</div>
      <Button fullWidth shadow onClick={onClickResult}>
        점수 보기
      </Button>
    </>
  );
};

const style = css`
  div {
    margin-bottom: 4rem;
  }
`;

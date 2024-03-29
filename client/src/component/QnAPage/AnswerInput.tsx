import React, { useState } from "react";
import { postAnswer } from "../../services/qna-service";
import { useAppDispatch } from "../../_app/hooks";
import { addAnswer } from "../../_reducer/qnaReducer";
import { Button } from "../common/Button/Button";
import { Input } from "../common/Input/Input";

export const AnswerInput = ({ id }: { id: string }) => {
  const dispatch = useAppDispatch();
  const [answer, setAnswer] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<any>) => {
    e.persist();
    setAnswer(e.target.value);
  };

  const handleSubmit = async () => {
    await postAnswer(id, answer);
    setIsOpen(!isOpen);
    dispatch(addAnswer({ answer: answer, id: id }));
  };

  return (
    <div>
      <Button fullWidth onClick={() => setIsOpen(!isOpen)}>
        답변 달기
      </Button>
      {isOpen && (
        <div>
          <Input
            textArea
            name="answer"
            onChange={handleInputChange}
            value={answer}
            placeholder="답변 내용을 입력해주세요."
            required
          ></Input>
          <Button fullWidth onClick={handleSubmit}>
            등록
          </Button>
        </div>
      )}
    </div>
  );
};

import { FormEvent, useState } from "react";
import Link from "next/link";
import { LoginInputs } from "../../../types/auth";
import { useAppDispatch } from "../../_app/hooks";
import { getUserInfo, login } from "../../services/auth-service";
import { setUser } from "../../_reducer/userReducer";
import { Input } from "../common/Input/Input";
import { Button } from "../common/Button/Button";
import { AlertToast } from "../common/AlertToast/AlertToast";
import style from "./User.module.scss";

export const LoginForm = () => {
  const initialValues: LoginInputs = { email: "", passwd: "" };
  const [inputs, setInputs] = useState<LoginInputs>(initialValues);
  const [isAlert, setIsAlert] = useState(false);
  const [messageContent, setMessageContent] = useState("");
  const dispatch = useAppDispatch();

  const handleInputChange = (e: React.ChangeEvent<any>) => {
    e.persist();
    setInputs({
      ...inputs,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const res = await login(inputs);
    if (res?.status === 201) {
      dispatch(setUser(res.data));
    } else {
      setIsAlert(true);
      setMessageContent(res?.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={style.LoginForm}>
      <Input
        type="email"
        name="email"
        placeholder="email"
        onChange={handleInputChange}
        value={inputs.email}
        required
      />
      <Input
        type="password"
        name="passwd"
        placeholder="Password"
        onChange={handleInputChange}
        value={inputs.passwd}
        required
        minLength={8}
      />
      <Button type="submit">Login</Button>
      <div className={style.infoText}>
        <div>한올이 처음이라면?</div>
        <Link href="/join" passHref>
          <div>회원가입하러 가기</div>
        </Link>
      </div>
      {isAlert && <AlertToast message={messageContent} />}
    </form>
  );
};

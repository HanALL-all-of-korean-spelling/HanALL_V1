import React from "react";
import style from "./ListView.module.scss";

type listType = {
  children: React.ReactNode;
};

export const ListView = ({ children }: listType) => {
  return <div className={style.ListView}>{children}</div>;
};

import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "../_app/store";
import { IUser } from "../../types/auth";

export interface UserState {
  user?: IUser;
}

const initialState: UserState = {
  user: undefined,
};

export const UserSlice = createSlice({
  name: "userReducer",
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
    },
    setUserScore: (state, action) => {
      if (state.user != undefined) {
        state.user.userPoint += action.payload;
      }
    },
  },
});

export const { setUser, setUserScore } = UserSlice.actions;

export const getUser = (state: RootState) => state.user;

export default UserSlice.reducer;

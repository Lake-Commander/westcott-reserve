import { UPDATE_USER } from "./constant";

export const SET_USER = "SET_USER";
export const CLEAR_USER = "CLEAR_USER";

const initialState = {
  user: null,
};

export const userReducer = (state = initialState, action) => {
  switch (action.type) {
    case SET_USER:
      return {
        ...state,
        user: action.payload || action.data,
      };

    case CLEAR_USER:
      return {
        ...state,
        user: null,
      };

    case UPDATE_USER:
      if (!state.user) return state;

      if (action.data?.oldPassword && action.data.oldPassword !== state.user.password) {
        console.warn("Old password does not match");
        return state;
      }

      return {
        ...state,
        user: {
          ...state.user,
          ...action.data,
          name: action.data?.name || state.user.name,
          username: action.data?.username || state.user.username,
          mobile: action.data?.mobile || state.user.mobile,
          email: action.data?.email || state.user.email,
          password: action.data?.newPassword || state.user.password,
          mpin: action.data?.newMpin || state.user.mpin,
        },
      };

    default:
      return state;
  }
};
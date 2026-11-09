import { createContext, useContext } from "react";
export const AuthContext = createContext(null);
export const ShopContext = createContext(null);
export const NoticeContext = createContext(null);
export const useAuth = () => useContext(AuthContext);
export const useShop = () => useContext(ShopContext);
export const useNotice = () => useContext(NoticeContext);

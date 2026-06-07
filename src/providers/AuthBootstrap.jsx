import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { getCurrentUser } from "../api/auth.api.js";
import { useAuthStore } from "../store/auth.store.js";
import { queryKeys } from "../utils/queryKeys.js";

export function AuthBootstrap() {
  const token = useAuthStore((state) => state.token);
  const setUser = useAuthStore((state) => state.setUser);

  const authUserQuery = useQuery({
    queryKey: queryKeys.authUser,
    queryFn: getCurrentUser,
    enabled: Boolean(token),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    const user = authUserQuery.data?.user ?? authUserQuery.data;
    if (user) {
      setUser(user);
    }
  }, [authUserQuery.data, setUser]);

  return null;
}

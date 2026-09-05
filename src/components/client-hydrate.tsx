import { useEffect, useRef } from "react";
import { useHouseUser } from "@/lib/firebase/session";
import { useBag } from "@/lib/bag";
import { hydrateClientBag, saveRemoteBag } from "@/lib/client-closet";

export function ClientHydrate() {
  const { user, isPending } = useHouseUser();
  const items = useBag((s) => s.items);
  const ready = useRef(false);

  useEffect(() => {
    if (isPending || !user) {
      ready.current = false;
      return;
    }
    let alive = true;
    void hydrateClientBag(user.id).then(() => {
      if (alive) ready.current = true;
    });
    return () => {
      alive = false;
    };
  }, [user?.id, isPending]);

  useEffect(() => {
    if (!user || !ready.current) return;
    void saveRemoteBag(user.id, items);
  }, [items, user]);

  return null;
}

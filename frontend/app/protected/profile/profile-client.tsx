"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { LogoutButton } from "../../../components/logout-button";
import { createClient } from "@/lib/supabase/client";

export default function ProfileClient() {
  const [user, setUser] = useState<any>(null);
  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      setUser(data?.user);
    };
    fetchUser();
  }, []);

  const name = user?.user_metadata?.name || user?.email?.split("@")[0] || "User";
  const email = user?.email || "No email";
  const image = user?.user_metadata?.avatar_url || "/default-user.png";

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <Image
        src={image}
        alt="User profile picture"
        width={96}
        height={96}
        className="rounded-full border shadow"
      />
      <div className="text-xl font-semibold">{name}</div>
      <div className="text-gray-500">{email}</div>
      <div className="mt-6">
        <LogoutButton />
      </div>
    </div>
  );
}
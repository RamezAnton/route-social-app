import { Link } from "react-router-dom";
import { Button } from "@heroui/react";
import { Users } from "lucide-react";

export default function Community() {
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="flex items-center gap-2 text-xl font-bold">
        <Users size={22} />
        Community
      </h1>
      <div className="rounded-2xl border border-default-200 bg-background p-6 text-center">
        <p className="text-sm text-default-500">
          Discover people to follow and grow your community.
        </p>
        <Link to="/suggestions">
          <Button className="mt-4">Browse suggested friends</Button>
        </Link>
      </div>
    </div>
  );
}

export function AuthorAvatar({
  name,
  avatarUrl,
}: {
  name: string;
  avatarUrl?: string;
}) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className="size-11 rounded-full object-cover"
      />
    );
  }
  return (
    <div className="flex size-11 items-center justify-center rounded-full bg-default-200 font-semibold">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

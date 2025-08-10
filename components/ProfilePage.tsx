import React from "react";
import { useSession, signIn, signOut } from "next-auth/react";

const ProfilePage: React.FC = () => {
  const { data: session } = useSession();

  return (
    <div
      className={`min-h-fit mx-auto p-4 border bg-base-100 rounded-md shadow-md max-w-7xl`}
    >
      <h2 className="text-2xl font-bold mb-6 text-center">Profile</h2>
      {!session ? (
        <div className="flex flex-col items-center">
          <p className="mb-4">Please sign in to view your profile</p>
          <button
            className="btn btn-primary"
            onClick={() => signIn("google")}
          >
            Sign in with Google
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <img
            src={session?.user?.image ?? "/default-profile.png"}
            alt="Profile"
            className="w-24 h-24 rounded-full mb-4 shadow border-4 border-white object-cover bg-gray-200"
          />
          <div className="text-center mb-4">
            <div className="font-semibold text-lg">{session?.user?.name}</div>
            <div className="text-gray-500">{session?.user?.email}</div>
          </div>
          <button
            className="btn btn-sm btn-error mb-6"
            onClick={() => signOut()}
          >
            Sign out
          </button>
          <pre className="bg-gray-100 p-3 rounded-md overflow-x-auto w-full text-xs">
            {JSON.stringify(session, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;

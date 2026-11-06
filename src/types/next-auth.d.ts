import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role?: string;
      organizationId?: string;
      passwordChangedAt?: string | null;
      mustChangePassword?: boolean;
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    role?: string;
    organizationId?: string;
    passwordChangedAt?: Date | null;
    mustChangePassword?: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: string;
    organizationId?: string;
    passwordChangedAt?: string | null;
    mustChangePassword?: boolean;
  }
}

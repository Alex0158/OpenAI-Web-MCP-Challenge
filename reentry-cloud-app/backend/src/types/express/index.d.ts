declare global {
  namespace Express {
    interface Request {
      auth?: {
        kind: "user" | "developer";
        accountId: string;
      };
      organizationAuth?: {
        organizationId: string;
      };
    }
  }
}

export {};

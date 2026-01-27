declare module '@sendgrid/mail' {
  const sgMail: {
    setApiKey: (apiKey: string) => void;
    send: (message: Record<string, unknown>) => Promise<unknown>;
  };
  export default sgMail;
}

import { getSession } from "next-auth/react";

import Login from "../../components/pageLayouts/authenticationPages/login";

const LoginPage = () => {
  return (
    <>
      <Login />
    </>
  );
};

export default LoginPage;

export const getServerSideProps = async (context) => {
  const session = await getSession({ req: context.req });
  if (session) {
    return { redirect: { destination: "/" } };
  }

  return { props: {} };
};

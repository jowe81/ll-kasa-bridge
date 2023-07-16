import { Link } from "react-router-dom";

function Home() {
  return (
    <>
      <div>Welcome to jjAuto</div>
      <div>
        Devices: <Link to={'/table'}>Table</Link>
      </div>
    </>
  );
}

export default Home;
import { Link } from "react-router-dom";

function Home() {
  return (
    <>
      <div>Welcome to jjAuto</div>
      <div>
        Devices:&nbsp;
        <Link to={'/table'}>Table</Link> |&nbsp; 
        <Link to={'/groups'}>Groups</Link> |&nbsp;
        <Link to={'/locations'}>Locations</Link>
      </div>
    </>
  );
}

export default Home;
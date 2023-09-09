import { Link } from "react-router-dom";

function Home() {
  return (
    <>
      <div>Welcome to jjAuto</div>
      <div>
        Devices:&nbsp;
        <Link to={'/touch'}>Touch UI</Link> |&nbsp; 
        <Link to={'/automation-panel'}>Automation Panel</Link>
      </div>
    </>
  );
}

export default Home;
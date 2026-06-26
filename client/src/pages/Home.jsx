import Button from "../components/Button";

const Home = () => {
  return (
    <>
      <div className="bg-[url('src/assets/images/Home.png')] bg-cover w-full h-screen flex flex-col justify-between items-center p-5">
        <h1 className="text-hero font-bold text-text-inverse text-shadow-text-base">
          Splitwise
        </h1>
        <p className="text-text-inverse bg-secondary-500 py-2 px-4 rounded">
          A website to split expenses...
        </p>
        <div className="flex flex-col justify-center items-center gap-1">
          <div className="text-text-inverse">Enjoy Splitting the bucks</div>
          <Button to={"/login"} variant="primary">
            Get Started
          </Button>
          <p className="text-text-muted text-tiny">designed by @prazdev</p>
        </div>
      </div>
    </>
  );
};

export default Home;

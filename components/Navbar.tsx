import { Box, Sparkles } from "lucide-react";
import { Button } from "./ui/Button";
import { useOutletContext, useNavigate, Link } from "react-router";

const Navbar = () => {
  const { isSignedIn, userName, signIn, signOut } = useOutletContext<AuthContext>();
  const navigate = useNavigate();

  const handleAuthClick = async () => {
    if (isSignedIn) {
      try {
        await signOut();
      } catch (e) {
        console.error(`Puter sign out failed: ${e}`);
      }
      return;
    }

    try {
      await signIn();
    } catch (e) {
      console.error(`Puter sign in failed: ${e}`);
    }
  };

  return (
    <header className="navbar">
      <nav className="inner">
        <div className="left">
          <div className="brand" onClick={() => navigate("/")}>
            <Box className="logo" />
            <span className="name">Roomify</span>
          </div>

          <ul className="links">
            <Link
              to="/demo"
              className="inline-flex items-center space-x-1 font-semibold text-orange-600 hover:text-orange-700 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-orange-500" />
              <span>Watch Demo</span>
            </Link>
            <a href="/#projects">Projects</a>
          </ul>
        </div>

        <div className="actions">
          <Link
            to="/demo"
            className="hidden md:inline-flex items-center text-xs font-mono uppercase tracking-wider text-zinc-600 hover:text-black px-2.5 py-1.5 rounded-md hover:bg-black/5 transition-colors"
          >
            Watch Demo
          </Link>

          {isSignedIn ? (
            <>
              <span className="greeting">
                {userName ? `Hi, ${userName}` : "Signed in"}
              </span>

              <Button size="sm" onClick={handleAuthClick} className="btn">
                Log Out
              </Button>
            </>
          ) : (
            <>
              <Button onClick={handleAuthClick} size="sm" variant="ghost">
                Log In
              </Button>
              <a href="/#upload" className="cta">
                Get Started
              </a>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;

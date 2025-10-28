import HomePage from "../pages/home/home-page";
import LoginPage from "../pages/auth/login-page";
import RegisterPage from "../pages/auth/register-page";
import AddStoryPage from "../pages/add-story/add-story-page";
import AboutPage from "../pages/about/about-page"; // <-- Impor AboutPage

const routes = {
  "/": new HomePage(),
  "/login": new LoginPage(),
  "/register": new RegisterPage(),
  "/add-story": new AddStoryPage(),
  "/about": new AboutPage(), // <-- Tambahkan rute untuk AboutPage
};

export default routes;

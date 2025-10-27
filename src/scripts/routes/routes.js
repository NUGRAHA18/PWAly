import HomePage from "../pages/home/home-page";
import LoginPage from "../pages/auth/login-page";
import RegisterPage from "../pages/auth/register-page";
import AddStoryPage from "../pages/add-story/add-story-page"; // <-- Tambahkan ini

const routes = {
  "/": new HomePage(),
  "/login": new LoginPage(),
  "/register": new RegisterPage(),
  "/add-story": new AddStoryPage(), // <-- Tambahkan rute ini
};

export default routes;

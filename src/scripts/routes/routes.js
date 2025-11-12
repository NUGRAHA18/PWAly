import HomePage from "../pages/home/home-page";
import LoginPage from "../pages/auth/login-page";
import RegisterPage from "../pages/auth/register-page";
import AddStoryPage from "../pages/add-story/add-story-page";
import AboutPage from "../pages/about/about-page";
import FavoritePage from "../pages/favorite/favorite-page";
import StoryDetailPage from "../pages/story-detail/story-detail-page";
import MyStoriesPage from "../pages/my-stories/my-stories-page";

const routes = {
  "/": new HomePage(),
  "/login": new LoginPage(),
  "/register": new RegisterPage(),
  "/add-story": new AddStoryPage(),
  "/about": new AboutPage(),
  "/favorites": new FavoritePage(),
  "/my-stories": new MyStoriesPage(),
  "/my-stories": new MyStoriesPage(),
  "/story/:id": new StoryDetailPage(),
};
export default routes;

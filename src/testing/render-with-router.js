import { BrowserRouter } from "react-router-dom";
import { render } from "@testing-library/react";

export const renderWithRouter = (ui, { route = "/" } = {}) => {
  window.history.pushState({}, "Test page", route);

  return {
    ...render(ui, { wrapper: BrowserRouter }),
  };
};

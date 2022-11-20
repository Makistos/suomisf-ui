import { BrowserRouter } from "react-router-dom";
import { render } from "@testing-library/react";

export const renderWithRouter = (ui, { route = "/" } = {}) => {
  return {
    ...render(ui, { wrapper: BrowserRouter }),
  };
};

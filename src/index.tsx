import React from "react"

import todo from "./todo"
import chat from "./chat"
import { argp } from "./util"
import { Container } from "@material-ui/core"
import { WithFallback } from "./util"
import { ErrorMessage } from "./util.ui"
import { render } from "react-dom"

const apps = {
  todo,
  chat
}

const app = argp("app")
const App = apps[app ? app : "todo"]

render(
  (
    <WithFallback fallback={ErrorMessage}>
      <Container maxWidth="xs">
        {App ? <App /> : "no such application"}
      </Container>
    </WithFallback >
  ),
  document.getElementById("app")
)

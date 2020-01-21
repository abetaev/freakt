import React from "react"

import todo from "./apps/todo"
import chat from "./apps/chat"
import comm from "./apps/comm"
import { argp } from "./util"
import { Container } from "@material-ui/core"
import { WithFallback } from "./util"
import { ErrorMessage } from "./util.ui"
import { render } from "react-dom"

const apps = {
  todo,
  chat,
  comm
}

const app = argp("app")
const App = apps[app ? app : "todo"]

render(
  (
    <WithFallback fallback={ErrorMessage}>
      {App ? <App /> : "no such application"}
    </WithFallback >
  ),
  document.getElementById("app")
)

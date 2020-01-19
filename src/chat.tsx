import { Grid, Paper, TextField, Typography } from "@material-ui/core";
import Peer from "peerjs";
import React from "react";
import { v4 as uuid } from "uuid";
import * as STATE from "./state";
import { State } from "./state";

const localId = uuid()
const peer = new Peer(localId)

const iColor = "#caede4"
const uColor = "#f5dcc2"

type Chat = Message[]
type Message = { from: string, body: string }

const MessageList = ({ state }) => (
  <state.Fragment>
    {messages => messages.map(
      ({ from, body }, key: number) => (
        <Paper style={{ backgroundColor: from === localId ? iColor : uColor }} key={key}>
          <Grid container>
            <Grid item><Typography style={{ fontWeight: "bold" }}>{
            from === localId ? "i" : "u"
            }:</Typography></Grid>
            <Grid item>{body}</Grid>
          </Grid>
        </Paper>
      )
    )}
  </state.Fragment>
)

const chatState: State<Chat> = STATE.define<Chat>([])

const MessageInput = ({ conn }) => {
  return (
    <TextField fullWidth autoFocus
      style={{ backgroundColor: iColor }}
      onKeyDown={({ target, key }) => {
        if (key === "Enter") {
          const { value } = target
          conn.send(value)
          chatState.value().push({ from: localId, body: value })
          chatState.update()
          target.value = ""
        }
      }} />
  )
}

peer.on("connection", conn => {
  conn.on("data", data => {
    chatState.value().push({ from: conn.peer, body: data })
    chatState.update()
  })
})

const ChatView = ({ remoteId }) => {
  const conn = peer.connect(remoteId)
  const state = STATE.define(false)

  conn.on("open", () => state.set(true))

  console.log(remoteId)
  return (
    <state.Fragment>
      {open => (
        <Grid container alignItems="flex-end">
          <Grid item xs={12}>
            remote id: {remoteId}
          </Grid>
          <Grid item xs={12}>
            <MessageList state={chatState} />
          </Grid>
          <Grid item xs={12}>
            {open ?
              <MessageInput conn={conn} /> :
              "connecting..."}
          </Grid>
        </Grid>
      )}
    </state.Fragment>
  )
}

const RemoteSelect = ({ state }: { state: State<string> }) => {
  return (
    <TextField fullWidth autoFocus
      style={{ backgroundColor: uColor }}
      onKeyDown={({ target, key }) => {
        if (key === "Enter") {
          const { value } = target
          state.set(value)
        }
      }} />
  )
}

export default () => {
  const state = STATE.define()
  return (
    <Grid container>
      <Grid item xs={12}>
        your id: {localId}
      </Grid>
      <Grid item xs={12}>
        <state.Fragment>
          {remoteId => remoteId ? (
            <ChatView remoteId={remoteId} />
          ) : (
              <RemoteSelect state={state} />
            )}
        </state.Fragment>
      </Grid>
    </Grid>
  )
}

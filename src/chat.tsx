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

const ChatView = ({ conn }: { conn: Peer.DataConnection }) => {
  const state = STATE.define(false)

  conn.on("open", () => state.set(true))
  conn.on("data", data => {
    chatState.value().push({ from: conn.peer, body: data })
    chatState.update()
  })

  return (
    <state.Fragment>
      {open => (
        <Grid container alignItems="flex-end">
          <Grid item xs={12}>
            remote id: {conn.peer}
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

const RemoteSelect = ({ state }: { state: State<Peer.DataConnection> }) => {
  return (
    <TextField fullWidth autoFocus
      style={{ backgroundColor: uColor }}
      onKeyDown={({ target: { value }, key }) => {
        if (key === "Enter") {
          const conn = peer.connect(value)
          state.set(conn)
        }
      }} />
  )
}

export default () => {
  const state = STATE.define<Peer.DataConnection>()

  peer.on("connection", conn => {
    state.set(conn)
  })

  return (
    <Grid container>
      <Grid item xs={12}>
        your id: {localId}
      </Grid>
      <Grid item xs={12}>
        <state.Fragment>
          {conn => conn ? (
            <ChatView conn={conn} />
          ) : (
              <RemoteSelect state={state} />
            )}
        </state.Fragment>
      </Grid>
    </Grid>
  )
}

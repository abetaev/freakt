import * as STATE from "../state";
import Peer from "peerjs"
import React, { Fragment } from 'react'
import { Paper, TextField, Button, Card, CardMedia, CardActions, CardContent, Container, IconButton } from '@material-ui/core'
import { render } from 'react-dom'

import PauseIcon from '@material-ui/icons/Pause'
import PlayIcon from '@material-ui/icons/PlayArrow'

interface Network {
  peer: Peer
  connections: { [identity: string]: Peer.MediaConnection }
}

interface Comm { [identity: string]: MediaStream }

const cs = window.crypto.subtle;

const state = STATE.define<{
  network?: Network,
  comm?: Comm
}>({
  network: undefined,
  comm: undefined
})

async function init() {
  const keyPair = await cs.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 256,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256"
    },
    true,
    [
      "encrypt",
      "decrypt"
    ]
  )

  const jwk = await cs.exportKey("jwk", keyPair.publicKey)
  const network = { peer: new Peer(jwk.n), connections: {} }

  network.peer.on("call", call => {
    call.answer(comm[network.peer.id])
    call.on("stream", stream => {
      comm[call.peer] = stream
      state.set({ network, comm })
    })
  })

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
  const comm = {}
  comm[network.peer.id] = stream

  await state.set({ network, comm })

}

export default () => {

  init()

  return (
    <Container maxWidth="md">
      <state.Fragment>
        {({ network, comm }) => {
          console.log({ network, comm })
          return (
            <Fragment>
              {(network && comm) && (
                <Fragment>
                  <Paper>
                    own identity: {network.peer.id}
                  </Paper>
                  <Paper>
                    <TextField label="add peer" onKeyPress={({ key, target }) => {
                      if (key === "Enter") {
                        const identity: string = target['value']
                        const call = network.peer.call(identity, comm[network.peer.id])
                        call.on('stream', stream => {
                          comm[identity] = stream
                          state.set({ network, comm })
                        })
                      }
                    }} />
                  </Paper>
                  <Fragment>
                    {Object.keys(comm)
                      .map(identity => {
                        const ref = React.createRef<HTMLVideoElement>()
                        return (
                          <Card>
                            <CardMedia>
                              <video
                                key={identity}
                                width="100%"
                                ref={ref}
                                onPlay={() => ref.current.srcObject = comm[identity]}
                                muted={identity === network.peer.id} />
                            </CardMedia>
                            <CardContent>
                              {identity}
                            </CardContent>
                            <CardActions>
                              <IconButton onClick={() => ref.current.pause()} >
                                <PauseIcon />
                              </IconButton>
                              <IconButton onClick={() => ref.current.play()}>
                                <PlayIcon />
                              </IconButton>
                            </CardActions>
                          </Card>
                        )
                      })}
                  </Fragment>
                </Fragment>
              ) || "connecting..."}
            </Fragment>
          )
        }}
      </state.Fragment>
    </Container>
  )

}
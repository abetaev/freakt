import { Box, ButtonGroup, Card, CardHeader, Container, Dialog, DialogContent, DialogTitle, Grid, GridList, GridListTile, IconButton, Paper, TextField, CardActions } from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import AddIcon from '@material-ui/icons/Add';
import DoneIcon from '@material-ui/icons/Done';
import EditIcon from '@material-ui/icons/Edit';
import ErrorIcon from '@material-ui/icons/Error';
import CheckedIcon from '@material-ui/icons/CheckBox';
import UncheckedIcon from '@material-ui/icons/CropSquare';
import React, { Fragment } from 'react';
import { render } from 'react-dom';
import 'typeface-roboto';
import { WithFallback } from './util';
import * as STATE from './state';
import { State } from './state';

type Record = { text: string, checked: boolean }
type Records = Record[]

const ErrorMessage = ({ error }: { error: Error }) => (
  <Dialog open={true} >
    <Grid container alignItems="center" >
      <Grid item xs={2}>
        <Box marginLeft="20px">
          <ErrorIcon fontSize="large" />
        </Box>
      </Grid>
      <Grid item xs={10}>
        <DialogTitle>
          {error.name}
        </DialogTitle>
        <DialogContent>
          {error.message}
        </DialogContent>
      </Grid>
    </Grid>
  </Dialog>
)

type RecordProps = {
  state: State<Record>
  onDelete: () => void
}

const RecordViewCard = ({ record, onEdit, onDelete, onToggle }) => (
  <Card>
    <CardHeader
      avatar={
        record.checked ? (
          <CheckedIcon onClick={() => onToggle()} />
        ) : (
            <UncheckedIcon onClick={() => onToggle()} />
          )
      }
      title={<Box onClick={() => onToggle()}>{record.text}</Box>}
      action={
        <ButtonGroup>
          <IconButton onClick={() => onEdit()}>
            <EditIcon />
          </IconButton>
          <IconButton onClick={() => onDelete()}>
            <DeleteIcon />
          </IconButton>
        </ButtonGroup>
      }
    />
  </Card>
)

const RecordEditCard = ({ record: { text, checked }, onComplete, icon }) => {
  const inputRef = React.createRef()
  return (
    <Card>
      <CardHeader
        title={
          <TextField multiline defaultValue={text} fullWidth inputRef={inputRef}
            onChange={({ target: { value } }) => text = value} />
        }
        action={(
          <IconButton onClick={() => {
            inputRef.current.value = "";
            onComplete({ text, checked })
          }}>
            {icon}
          </IconButton>
        )}
      />
    </Card>
  )
}

const Record = ({ state: recordState, onDelete }: RecordProps) => {
  const editState = STATE.define(false)
  const state = STATE.compose({
    edit: editState,
    record: recordState
  })
  return (
    <state.Fragment>
      {({ record, edit }) => record && (
        edit ? (
          <RecordEditCard record={record} icon={<DoneIcon />}
            onComplete={(record: Record) => state.set({ record, edit: false })} />
        ) : (
            <RecordViewCard record={record}
              onEdit={() => editState.set(true)}
              onDelete={onDelete}
              onToggle={() => {
                const state = STATE.extract(recordState, "checked")
                state.set(!state.value())
              }}
            />
          )
      ) || null}
    </state.Fragment>
  )
}

const Records = ({ state }: { state: State<Records> }) => (
  <Paper>
    <Grid container>
      <Grid item xs={12}>
        <RecordEditCard record={{ text: "", checked: false }} icon={<AddIcon />}
          onComplete={(record: Record) => {
            const value = state.value() || []
            value.push(record)
            state.set(value)
          }} />
      </Grid>
      <state.Fragment>
        {(records) => records && Object.keys(records)
          .map(key => (
            <Grid item xs={12} key={key}>
              <Record state={STATE.extract<Records>(state, +key) as State<Record>}
                onDelete={() => { records.splice(+key, 1); state.set(records) }} />
            </Grid>
          )) || null}
      </state.Fragment>
    </Grid>
  </Paper>
)

render(
  (
    <WithFallback fallback={ErrorMessage}>
      <Container maxWidth="xs">
        <Records state={STATE.define([
          { text: "buy milk", checked: false },
          { text: "pay rent", checked: true },
          { text: "get mail", checked: false }
        ])} />
      </Container>
    </WithFallback >
  ),
  document.getElementById("app")
)

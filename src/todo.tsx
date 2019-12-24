import { Box, Container, Dialog, DialogContent, DialogTitle, Grid, IconButton, TextField } from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import CheckedIcon from '@material-ui/icons/CheckBox';
import UncheckedIcon from '@material-ui/icons/CropSquare';
import DeleteIcon from '@material-ui/icons/Delete';
import DoneIcon from '@material-ui/icons/Done';
import ErrorIcon from '@material-ui/icons/Error';
import UndoIcon from '@material-ui/icons/Undo';
import React from 'react';
import { render } from 'react-dom';
import 'typeface-roboto';
import * as STATE from './state';
import { State } from './state';
import { WithFallback } from './util';

type Record = { text: string, checked: boolean }
type Records = Record[]
type RecordId = keyof Records & number
type Selection = RecordId | undefined
type RecordListState = State<{ records: Records, selection: Selection }>

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

const List = ({ children }) => (
  <Grid container direction="column">
    {children}
  </Grid>
)

const ListItem = ({ children }) => (
  <Grid item container direction="row" alignItems="center">
    {children}
  </Grid>
)

type RecordListHeaderProps = { state: RecordListState }
const RecordListHeader = ({ state }: RecordListHeaderProps) => {
  const {
    records: recordsState,
    selection: selectionState
  } = state.explode()
  const ref = React.createRef<HTMLInputElement>()
  function add(records: Records) {
    if (ref.current.value) {
      records.push({ text: ref.current.value, checked: false })
      ref.current.value = ''
      recordsState.set(records)
    }
  }
  return (
    <state.Fragment>
      {({ selection, records }) => {
        const undoText = selection === undefined ? undefined : records[selection].text
        return selection === undefined ? (
          <ListItem>
            <Grid item xs>
              <TextField fullWidth autoFocus inputRef={ref}
                onKeyDown={({ key }) => {
                  switch (key) {
                    case 'ArrowDown':
                      selectionState.set(0)
                      break;
                    case 'ArrowUp':
                      selectionState.set(records.length - 1)
                      break;
                    case 'Enter':
                      add(records)
                      break;
                  }
                }} />
            </Grid>
            <Grid item>
              <IconButton onClick={({ }) => add(records)}>
                <AddIcon />
              </IconButton>
            </Grid>
          </ListItem>
        ) : (
            <Grid item container justify="flex-end">
              <Grid item>
                <IconButton onClick={() => {
                  records[selection].text = undoText;
                  state.set({ records, selection: undefined })
                }}>
                  <UndoIcon />
                </IconButton>
              </Grid>
            </Grid>
          )
      }}
    </state.Fragment>
  )
}

type RecordListItemProps = {
  state: RecordListState
  item: number
}
const RecordListItem = ({ state, item }: RecordListItemProps) => {
  const {
    records: recordsState,
    selection: selectionState
  } = state.explode()
  const recordState = recordsState.explode()[item]
  const {
    text: recordTextState,
    checked: recordCheckedState
  } = recordState.explode();
  function handleKeyPress(key) {
    switch (key) {
      case 'Enter':
        recordTextState.set(ref.current.value)
      case 'Escape':
        selectionState.set(undefined)
        break;
      case 'ArrowDown':
        selectionState.set(item + 1)
        break;
      case 'ArrowUp':
        selectionState.set(item - 1)
        break;
    }
  }
  const ref = React.createRef<HTMLInputElement>()
  return (
    <state.Fragment>
      {({ records, selection }) =>
        <ListItem>
          <Grid item>
            <IconButton onClick={() => recordCheckedState.set(!records[item].checked)}>
              {records[item].checked ? <CheckedIcon /> : <UncheckedIcon />}
            </IconButton>
          </Grid>
          <Grid item xs onClick={() => selectionState.set(item)}>
            {selection === item ? (
              <TextField fullWidth autoFocus inputRef={ref}
                defaultValue={records[item].text}
                onKeyDown={({ key }) => handleKeyPress(key)} />
            ) : records[item].text}
          </Grid>
          <Grid item>
            {selection === item ? (
              <IconButton onClick={() => handleKeyPress('Enter')}>
                <DoneIcon />
              </IconButton>
            ) : (
                <IconButton onClick={() => records.splice(item, 1) && recordsState.set(records)} >
                  <DeleteIcon />
                </IconButton>
              )}
          </Grid>
        </ListItem>
      }
    </state.Fragment>
  )
}

const Records = ({ state: recordsState }: { state: State<Records> }) => {
  const selectionState = STATE.define<Selection>(() => undefined)
  const state = STATE.compose({
    records: recordsState,
    selection: selectionState
  })
  return (
    <List>
      <ListItem>
        <RecordListHeader state={state} />
      </ListItem>
      <state.Fragment>
        {({ records }) => records && records.map((_, key) => (
          <RecordListItem key={key} state={state} item={key} />
        )) || null}
      </state.Fragment>
    </List>
  )
}

render(
  (
    <WithFallback fallback={ErrorMessage}>
      <Container maxWidth="xs">
        <Records state={STATE.define<Records>(
          localStorage.getItem('records') && JSON.parse(localStorage.getItem('records'))
          || [
            { text: "buy milk", checked: false },
            { text: "pay rent", checked: true },
            { text: "get mail", checked: false }
          ], async (records) => {
            localStorage['records'] = JSON.stringify(records)
            return records
          })} />
      </Container>
    </WithFallback >
  ),
  document.getElementById("app")
)

import { Box, Dialog, DialogContent, DialogTitle, Grid } from '@material-ui/core'
import ErrorIcon from '@material-ui/icons/Error'
import React from 'react'

export const ErrorMessage = ({ error }: { error: Error }) => (
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

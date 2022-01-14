import React, { useRef, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import { API, Application, DatasetType, IVector, PluginRegistry, PSEContextProvider, PSEPlugin, RootState, createRootReducer, PSELayer } from 'projection-space-explorer';
import * as THREE from 'three'
import { GLHeatmap } from './GLHeatmap';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, List, ListItem, Slider, TextField, Typography } from '@mui/material';
import { SoundPrint } from './SoundPrint';
import { CompactPicker } from 'react-color';

export const DATASETCONFIG = [
  {
    display: "Andreas Album",
    path: "./coverart/names2.csv",
    type: DatasetType.Sound
  }
]







class SoundPlugin extends PSEPlugin {
  type = 'sound'

  createFingerprint(vectors: IVector[], scale: number, aggregate: boolean): JSX.Element {
    return <SoundPrint vectors={vectors} aggregate={aggregate}></SoundPrint>
  }

  hasFileLayout(header: string[]) {
    return this.hasLayout(header, ['wav', 'stft'])
  }
}

PluginRegistry.getInstance().registerPlugin(new SoundPlugin())

const api = //@ts-ignore
  new API<RootState>(null, createRootReducer({}))


function FrontLayer() {
  const [open, setOpen] = React.useState(false);

  const handleClose = () => {
    setOpen(false);
  };

  const ref = useRef<any>()

  const [pointSize, setPointSize] = React.useState(20)
  const [lineWidth, setLineWidth] = React.useState(5)
  const [pointBrightness, setPointBrightness] = React.useState(0.5)
  const [background, setBackground] = React.useState('#fff')
  const [lineFilter, setLineFilter] = React.useState('drop-shadow(-9px 9px 3px #e81)')
  const [pointFilter, setPointFilter] = React.useState('drop-shadow(-9px 9px 3px #e81)')
  const [padding, setPadding] = React.useState(64)

  const handleChangeC = (color: any) => {
    setBackground(color.hex)
    api.generateImage(2048, 2048, padding, { pointSize, lineWidth, pointBrightness, backgroundColor: color.hex, pointFilter, lineFilter }, ref.current.getContext('2d'))
  }

  return <PSELayer>
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth={false}
      style={{
        pointerEvents: 'all'
      }}
    >
      <DialogTitle>Optional sizes</DialogTitle>
      <DialogContent>
        <DialogContentText gutterBottom>
          Album Preview
        </DialogContentText>
        <div style={{
          display: 'flex'
        }}>
          <div style={{
            marginRight: 64
          }}>
            <Box sx={{ width: 300 }}>
              <Typography gutterBottom>
                Line Width
              </Typography>
              <Slider
                defaultValue={5}
                value={lineWidth}
                step={0.1}
                min={0}
                max={10}
                valueLabelDisplay="auto"
                onChange={(event, value) => {
                  setLineWidth(value as number)
                }}
                onChangeCommitted={(event, value) => {
                  setLineWidth(value as number)
                  api.generateImage(2048, 2048, padding, { pointSize: pointSize, lineWidth: value, backgroundColor: background }, ref.current.getContext('2d'))
                }}
              />
            </Box>

            <Box sx={{ width: 300 }}>
              <Typography gutterBottom>
                Point Size
              </Typography>
              <Slider
                defaultValue={20}
                step={0.1}
                value={pointSize}
                min={0}
                max={30}
                valueLabelDisplay="auto"
                onChange={(event, value) => {
                  setPointSize(value as number)
                }}
                onChangeCommitted={(event, value) => {
                  setPointSize(value as number)
                  api.generateImage(2048, 2048, padding, { pointSize: value, lineWidth, backgroundColor: background }, ref.current.getContext('2d'))
                }}
              />
            </Box>

            <Box sx={{ width: 300 }}>
              <Typography gutterBottom>
                Point Brightness
              </Typography>
              <Slider
                defaultValue={0.5}
                value={pointBrightness}
                min={0}
                step={0.01}
                max={1}
                valueLabelDisplay="auto"
                onChange={(event, value) => {
                  setPointBrightness(value as number)
                }}
                onChangeCommitted={(event, value) => {
                  setPointBrightness(value as number)
                  api.generateImage(2048, 2048, padding, { pointSize, lineWidth, pointBrightness, backgroundColor: background }, ref.current.getContext('2d'))
                }}
              />
            </Box>

            <CompactPicker
              color={background}
              onChangeComplete={handleChangeC}
            ></CompactPicker>

            <Box sx={{ margin: 1 }}>
              <TextField
                label="Point Filter"
                value={pointFilter}
                onChange={(event) => { setPointFilter(event.target.value) }}
              />
            </Box>

            <Box sx={{ margin: 1 }}>
              <TextField
                label="Line Filter"
                value={lineFilter}
                onChange={(event) => { setLineFilter(event.target.value) }}
              />
            </Box>

            <Box sx={{ width: 300 }}>
              <Typography gutterBottom>
                Padding
              </Typography>
              <Slider
                defaultValue={64}
                value={padding}
                step={1}
                min={0}
                max={128}
                valueLabelDisplay="auto"
                onChange={(event, value) => {
                  setPadding(value as number)
                }}
                onChangeCommitted={(event, value) => {
                  setPadding(value as number)
                  api.generateImage(2048, 2048, padding, { pointSize, lineWidth, backgroundColor: background }, ref.current.getContext('2d'))
                }}
              />
            </Box>
          </div>

          <canvas ref={ref} width={2048} height={2048} style={{
            width: 512,
            height: 512
          }} />
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
        <Button onClick={() => {
          api.generateImage(2048, 2048, padding, { pointSize, lineWidth, pointBrightness, pointFilter, lineFilter, backgroundColor: background }).then((result) => {
            function downloadBase64File(contentType: string, base64Data: string, fileName: string) {
              const linkSource = `data:${contentType};base64,${base64Data}`;
              const downloadLink = document.createElement("a");
              downloadLink.href = linkSource;
              downloadLink.download = fileName;
              downloadLink.click();
            }

            downloadBase64File('image/jpeg', result, 'test.jpg')
          })
        }}>Download</Button>
      </DialogActions>
    </Dialog>

    <Button style={{ pointerEvents: 'all' }} onClick={() => {
      setOpen(true)

      setTimeout(() => {
        api.generateImage(2048, 2048, 32, { pointSize, lineWidth, backgroundColor: background, padding }, ref.current.getContext('2d'))
      }, 1000)
    }}>
      Preview Album
    </Button>
  </PSELayer>
}

export function CIMEApp() {
  const [context] = useState(
    api
  );

  return (
    <PSEContextProvider context={context}>
      <Application
        overrideComponents={{
          layers: [
            {
              order: 1,
              component: <FrontLayer></FrontLayer>
            }
          ]
        }}
      />
    </PSEContextProvider>
  );
}

export default CIMEApp;
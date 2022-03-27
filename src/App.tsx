import React, { useEffect, useRef, useState } from 'react';
import './App.css';
import AudiotrackIcon from '@mui/icons-material/Audiotrack';
import {
  API,
  Application,
  DatasetType,
  IVector,
  PluginRegistry,
  PSEContextProvider,
  PSEPlugin,
  RootState,
  createRootReducer,
  PSELayer,
  RootActionTypes,
  Dataset,
  UtilityActions,
  CubicBezierCurve,
  CameraTransformations,
  ViewTransformType,
} from 'projection-space-explorer';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Slider,
  TextField,
  Typography,
  Card,
  CardContent,
  IconButton,
  ListItem,
  List,
  ListItemText,
  ListItemButton,
  Chip,
} from '@mui/material';

import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SkipNextIcon from '@mui/icons-material/SkipNext';

import { SoundPrint } from './SoundPrint';
import { CompactPicker } from 'react-color';
import { useSelector } from 'react-redux';

export const DATASETCONFIG = [
  {
    display: 'Andreas Album',
    path: './coverart/names2.csv',
    type: DatasetType.Sound,
  },
];

class SoundPlugin extends PSEPlugin {
  type = 'sound';

  createFingerprint(vectors: IVector[], scale: number, aggregate: boolean): JSX.Element {
    return <SoundPrint vectors={vectors} aggregate={aggregate}></SoundPrint>;
  }

  hasFileLayout(header: string[]) {
    return this.hasLayout(header, ['wav', 'stft']);
  }
}

PluginRegistry.getInstance().registerPlugin(new SoundPlugin());

const api = new API<RootState>(null, createRootReducer({})); //@ts-ignore

function CurveProgress({ playing, progress, song }: { playing: boolean; progress: number; song: number }) {
  const canvasRef = useRef<any>();

  const transform = useSelector<RootState>((state) => state.viewTransform) as ViewTransformType;
  const dataset = useSelector<RootState>((state) => state.dataset) as Dataset;

  const frameDuration = 5;
  const frame = Math.floor(progress / frameDuration);

  useEffect(() => {
    if (!dataset || !canvasRef.current) {
      return;
    }

    canvasRef.current.setAttribute('width', transform.width);
    canvasRef.current.setAttribute('height', transform.height);
    canvasRef.current.width = transform.width;
    canvasRef.current.height = transform.height;

    if (canvasRef.current && dataset) {
      renderCurve(canvasRef.current.getContext('2d'), curve, transform, frame, (progress / frameDuration) % 1);
    }
  }, [transform, dataset, progress]);

  if (!dataset || song < 0) {
    return null;
  }

  const curve = UtilityActions.solveCatmullRom(dataset.segments[song].vectors.map((vector) => [vector.x, vector.y]).flat(), 1);

  let p = UtilityActions.partialBezierCurve((progress / frameDuration) % 1, curve[frame]);
  p = CameraTransformations.worldToScreen(p, transform);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
    ></canvas>
  );
}

function renderCurve(ctx: CanvasRenderingContext2D, curve: CubicBezierCurve[], transform: ViewTransformType, until: number, t: number) {
  ctx.clearRect(0, 0, transform.width, transform.height);
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#007dad';
  ctx.globalAlpha = 0.75;
  //ctx.filter = 'drop-shadow(0px 0px 5px #007dad)';

  for (const segment of curve.slice(0, until)) {
    ctx.beginPath();
    segment.start = CameraTransformations.worldToScreen(segment.start, transform);
    segment.end = CameraTransformations.worldToScreen(segment.end, transform);

    segment.cp1 = CameraTransformations.worldToScreen(segment.cp1, transform);
    segment.cp2 = CameraTransformations.worldToScreen(segment.cp2, transform);

    ctx.moveTo(segment.start.x, segment.start.y);
    ctx.bezierCurveTo(segment.cp1.x, segment.cp1.y, segment.cp2.x, segment.cp2.y, segment.end.x, segment.end.y);
    ctx.stroke();
    ctx.closePath();
  }

  const last = curve[until];

  last.start = CameraTransformations.worldToScreen(last.start, transform);
  last.end = CameraTransformations.worldToScreen(last.end, transform);

  last.cp1 = CameraTransformations.worldToScreen(last.cp1, transform);
  last.cp2 = CameraTransformations.worldToScreen(last.cp2, transform);

  ctx.beginPath();
  let c = 0;
  for (; c < t; c = c + 0.01) {
    const { x, y } = UtilityActions.partialBezierCurve(c, last);
    ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.closePath();
  ctx.beginPath();

  const { x, y } = UtilityActions.partialBezierCurve(t, last);

  ctx.fillStyle = '#007dad';
  ctx.strokeStyle = 'black';
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.closePath();
}

function SideTab({ onPlayClick, onLoadBuffer, playing, song }: { onPlayClick: any; onLoadBuffer: any; playing: boolean; song: number }) {
  const dataset = useSelector<RootState>((state) => state.dataset) as Dataset;

  return (
    <div>
      <Button disabled={song < 0} onClick={() => onPlayClick()}>
        {playing ? 'STOP' : 'Start traversal'}
      </Button>

      <List style={{ pointerEvents: 'all', width: '100%' }}>
        {dataset?.segments.map((segment, i) => {
          return (
            <ListItem disablePadding secondaryAction={song === i ? <Chip label="playing"></Chip> : null}>
              <ListItemButton
                selected={song === i}
                onClick={() => {
                  lineSegmentToBuffer(dataset, dataset.segments[i].vectors).then((buffer) => {
                    onLoadBuffer(buffer, i);
                  });
                }}
              >
                <ListItemText primary={`Song ${i}`} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </div>
  );
}

function FrontLayer({ progress, song, playing }: { progress: any; song: any; playing: boolean }) {
  const [open, setOpen] = React.useState(false);

  const handleClose = () => {
    setOpen(false);
  };

  useEffect(() => {
    return () => {
      console.log('unmount front layer');
    };
  }, []);

  const dataset = useSelector<RootState>((state) => state.dataset) as Dataset;
  const [buffer, setBuffer] = useState<AudioBufferSourceNode | null>(null);

  const ref = useRef<any>();
  const containerRef = useRef<any>();

  const [pointSize, setPointSize] = React.useState(20);
  const [lineWidth, setLineWidth] = React.useState(5);
  const [pointBrightness, setPointBrightness] = React.useState(0.5);
  const [background, setBackground] = React.useState('#fff');
  const [lineFilter, setLineFilter] = React.useState('');
  const [pointFilter, setPointFilter] = React.useState('');
  const [padding, setPadding] = React.useState(64);

  const handleChangeC = (color: any) => {
    setBackground(color.hex);
    api.generateImage(
      2048,
      2048,
      padding,
      {
        pointSize,
        lineWidth,
        pointBrightness,
        backgroundColor: color.hex
      },
      ref.current.getContext('2d'),
    );
  };

  return (
    <PSELayer>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
        <CurveProgress playing={playing} progress={progress} song={song}></CurveProgress>

        <Dialog
          open={open}
          onClose={handleClose}
          fullWidth
          maxWidth={false}
          style={{
            pointerEvents: 'all',
          }}
        >
          <DialogTitle>Optional sizes</DialogTitle>
          <DialogContent>
            <DialogContentText gutterBottom>Album Preview</DialogContentText>
            <div
              style={{
                display: 'flex',
              }}
            >
              <div
                style={{
                  marginRight: 64,
                }}
              >
                <Box sx={{ width: 300 }}>
                  <Typography gutterBottom>Line Width</Typography>
                  <Slider
                    defaultValue={5}
                    value={lineWidth}
                    step={0.1}
                    min={0}
                    max={10}
                    valueLabelDisplay="auto"
                    onChange={(event, value) => {
                      setLineWidth(value as number);
                    }}
                    onChangeCommitted={(event, value) => {
                      setLineWidth(value as number);
                      api.generateImage(
                        2048,
                        2048,
                        padding,
                        {
                          pointSize: pointSize,
                          lineWidth: value,
                          backgroundColor: background,
                        },
                        ref.current.getContext('2d'),
                      );
                    }}
                  />
                </Box>

                <Box sx={{ width: 300 }}>
                  <Typography gutterBottom>Point Size</Typography>
                  <Slider
                    defaultValue={20}
                    step={0.1}
                    value={pointSize}
                    min={0}
                    max={30}
                    valueLabelDisplay="auto"
                    onChange={(event, value) => {
                      setPointSize(value as number);
                    }}
                    onChangeCommitted={(event, value) => {
                      setPointSize(value as number);
                      api.generateImage(
                        2048,
                        2048,
                        padding,
                        {
                          pointSize: value,
                          lineWidth,
                          backgroundColor: background,
                        },
                        ref.current.getContext('2d'),
                      );
                    }}
                  />
                </Box>

                <Box sx={{ width: 300 }}>
                  <Typography gutterBottom>Point Brightness</Typography>
                  <Slider
                    defaultValue={0.5}
                    value={pointBrightness}
                    min={0}
                    step={0.01}
                    max={1}
                    valueLabelDisplay="auto"
                    onChange={(event, value) => {
                      setPointBrightness(value as number);
                    }}
                    onChangeCommitted={(event, value) => {
                      setPointBrightness(value as number);
                      api.generateImage(
                        2048,
                        2048,
                        padding,
                        {
                          pointSize,
                          lineWidth,
                          pointBrightness,
                          backgroundColor: background,
                        },
                        ref.current.getContext('2d'),
                      );
                    }}
                  />
                </Box>

                <CompactPicker color={background} onChangeComplete={handleChangeC}></CompactPicker>

                <Box sx={{ margin: 1 }}>
                  <TextField
                    label="Point Filter"
                    value={pointFilter}
                    onChange={(event) => {
                      setPointFilter(event.target.value);
                    }}
                  />
                </Box>

                <Box sx={{ margin: 1 }}>
                  <TextField
                    label="Line Filter"
                    value={lineFilter}
                    onChange={(event) => {
                      setLineFilter(event.target.value);
                    }}
                  />
                </Box>

                <Box sx={{ width: 300 }}>
                  <Typography gutterBottom>Padding</Typography>
                  <Slider
                    defaultValue={64}
                    value={padding}
                    step={1}
                    min={0}
                    max={128}
                    valueLabelDisplay="auto"
                    onChange={(event, value) => {
                      setPadding(value as number);
                    }}
                    onChangeCommitted={(event, value) => {
                      setPadding(value as number);
                      api.generateImage(2048, 2048, padding, { pointSize, lineWidth, backgroundColor: background }, ref.current.getContext('2d'));
                    }}
                  />
                </Box>
              </div>

              <canvas
                ref={ref}
                width={2048}
                height={2048}
                style={{
                  width: 512,
                  height: 512,
                }}
              />
            </div>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Close</Button>
            <Button
              onClick={() => {
                api
                  .generateImage(2048, 2048, padding, {
                    pointSize,
                    lineWidth,
                    pointBrightness,
                    pointFilter,
                    lineFilter,
                    backgroundColor: background,
                  })
                  .then((result) => {
                    function downloadBase64File(contentType: string, base64Data: string, fileName: string) {
                      const linkSource = `data:${contentType};base64,${base64Data}`;
                      const downloadLink = document.createElement('a');
                      downloadLink.href = linkSource;
                      downloadLink.download = fileName;
                      downloadLink.click();
                    }

                    downloadBase64File('image/jpeg', result, 'test.jpg');
                  });
              }}
            >
              Download
            </Button>
          </DialogActions>
        </Dialog>

        <Button
          style={{ pointerEvents: 'all' }}
          onClick={() => {
            setOpen(true);

            setTimeout(() => {
              api.generateImage(2048, 2048, 32, { pointSize, lineWidth, backgroundColor: background, padding }, ref.current.getContext('2d'));
            }, 1000);
          }}
        >
          Preview Album
        </Button>
      </div>
    </PSELayer>
  );
}

var context = new AudioContext();

async function lineSegmentToBuffer(dataset: Dataset, vectors: IVector[]) {
  const decodeAsync = async (v: IVector, position: number) => {
    // @ts-ignore
    const byteCharacters = atob(v['wav']);
    const byteNumbers = new Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'audio/wav' });

    const arrayBuffer = await blob.arrayBuffer();

    try {
      const decoded = await context.decodeAudioData(arrayBuffer);
      return decoded;
    } catch (e) {
      return null;
    }
  };

  const buffers = (await Promise.all(vectors.map(decodeAsync))).filter((e) => e !== null) as AudioBuffer[];

  const numberOfChannels = Math.min(...buffers.map((buf) => buf.numberOfChannels));
  const size = buffers.reduce((prev, cur) => {
    return prev + cur.length;
  }, 0);
  const tmp = context.createBuffer(numberOfChannels, size, buffers[0].sampleRate);

  let offset = 0;
  buffers.forEach((buffer, i) => {
    for (let c = 0; c < tmp.numberOfChannels; c++) {
      const channel = tmp.getChannelData(c);
      channel.set(buffer.getChannelData(c), offset);
    }
    offset = offset + buffer.length;
  });

  var audioSource = context.createBufferSource();
  audioSource.connect(context.destination);

  // Concatenate the two buffers into one.
  audioSource.buffer = tmp;

  return audioSource;
}

export function CIMEApp() {
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(0);
  const [song, setSong] = useState(-1);
  const [int, setInt] = useState<any>();
  const [playing, setPlaying] = useState(false);
  const [buffer, setBuffer] = useState<any>();

  api.onStateChanged = (newState, difference, action) => {
    if (action.type === RootActionTypes.DATASET) {
      const dataset = action.dataset as Dataset;
    }
  };

  const onLoadBuffer = (newBuffer: any, i: number) => {
    if (buffer && playing) {
      buffer.stop();
    }
    if (int) {
      clearInterval(int);
    }

    setProgress(0);
    progressRef.current = 0;
    setInt(null);
    setPlaying(false);
    setBuffer(newBuffer);
    setSong(i);
  };

  const onPlayClick = () => {
    if (buffer) {
      if (playing) {
        buffer.stop();
        setPlaying(false);
        clearInterval(int);
        setSong(-1);
        setBuffer(null);
        setProgress(0);
        progressRef.current = 0;
        setInt(null);
      } else {
        buffer.start(0);
        buffer.playbackRate.value = 1;

        setInt(
          setInterval(() => {
            progressRef.current = progressRef.current + 0.05;
            setProgress(progressRef.current);
          }, 50),
        );
      }
    }

    setPlaying(!playing);
  };

  return (
    <PSEContextProvider context={api}>
      <Application
        overrideComponents={{
          layers: [
            {
              order: 1,
              component: <FrontLayer key="frontlayer" song={song} playing={playing} progress={progress}></FrontLayer>,
            },
          ],
          tabs: [
            {
              name: 'Audio',
              tab: <SideTab key="sidetab" onPlayClick={onPlayClick} onLoadBuffer={onLoadBuffer} playing={playing} song={song}></SideTab>,
              icon: () => <AudiotrackIcon></AudiotrackIcon>,
              title: 'Audio',
              description: 'Audio',
            },
          ],
        }}
      />
    </PSEContextProvider>
  );
}

export default CIMEApp;

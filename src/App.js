import logo from './logo.svg';
import './App.css';
import React, { useState, useEffect } from 'react';
import QRReader from './QRReader.js'
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import {getFromCache, cache, shouldUseCache} from "./Cache.js"

import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

const axios = require('axios');

function App() {

  const [selectedArr, setTheArray] = useState([])
  const [user, setUser] = useState({id: ""})
  const [openManual, setOpenManual] = React.useState(false);
  const [manualText, setManualText] = React.useState("");

  const [openOfficer, setOpenOfficer] = React.useState(false);
  const [officerText, setOfficerText] = React.useState("");
  const [officerName, setOfficerName] = React.useState("")

  const handleClickOpenManual = () => {
    setOpenManual(true);
  };

  const handleCloseManual = () => {
    setManualText("")
    setOpenManual(false);
  };

  const addItemManually = () => {
    setTheArray(selectedArr => [manualText, ...selectedArr]);
    setManualText("")
    setOpenManual(false)
  }

  const handleClickOpenOfficer = () => {
    setOpenOfficer(true);
  };

  const handleCloseOfficer = () => {
    setOpenOfficer(false);
  };

  const addOfficer = () => {
    cache("officer", officerText)
    setOfficerName(officerText)
    setOpenOfficer(false)
  }

  const handleSubmit = () => {
    var today = new Date();
    var time = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate()
    // should also add hour

    var value = 0
    selectedArr.forEach((id) => {
      if (gear_data[id]) {
        try {
          var cost = gear_data[id].cost.replace(/\\/g, '').replace(/['"]+/g, '').replace('$', '')
          if (cost != "") {
            value += parseInt(cost)
          }
        }
        catch {}
      }
    })

    var items = ""

    // Add all the scanned items
    selectedArr.forEach((id) => {
      if (gear_data[id]) {
        const name = gear_data[id].name.replace(/\\/g, '').replace(/['"]+/g, '')
        items += name + ", " + id + ";\n"
      }
    })

    // Add all the manual items
    selectedArr.forEach((id) => {
      if (!gear_data[id]) {
        items += id + ", N/A;\n"
      }
    })

    const submit_obj = {
      "phone": user.phone,
      "destination": user.destination,
      "Time": time,
      "id": user.id,
      "officer": officerName,
      "email": user.email,
      "value": value,
      "items": items
    }
    submit_json = JSON.stringify(submit_obj)
    const res = await axios.post('https://script.google.com/macros/s/AKfycbz-xjHDHWVp0Lfrn_dfxsqjfFIPWtQsN1nyC-TSkhWRgmKhqfEZLofAwp_oM6Umpts/exec', submit_json);

    setTheArray([])
    setManualText("")
    setUser({id: ""})
  }

  var usedMap = {}
  var gear_data = {}

  const addIdFromQR = (id) => {
     if (!usedMap[id]) {
      usedMap[id] = "used"
      const key = id.replace(/\\/g, '').replace(/['"]+/g, '')
      setTheArray(selectedArr => [key, ...selectedArr]);
     }
  }

  const addUserFromQR = (userObj) => {
    setUser(userObj)
  }

  useEffect(() => {
    if (shouldUseCache("officer", 1000 * 60 * 60 * 24)) {
      setOfficerName(getFromCache("officer"))
    }
    else {
      setOpenOfficer(true)
    }
  }, [])


  var cache_name = "gear"
  if (shouldUseCache(cache_name, 1 * 60 * 60 * 24)) {
    gear_data = getFromCache(cache_name)
  }
  else {
    // pull in the data
    axios.get('https://docs.google.com/spreadsheets/d/1fL7CJg5WG-355Eue_T08h9JDk4mCDgC2spfGlFGlRGU/gviz/tq?tqx=out:csv&sheet=Inventory')
      .then(function (response) {
        const resp_data = response.data
        const lines = resp_data.split('\n')
        const line_objects = {}
        for(var i=0; i<lines.length; i++) {
          const line_arr = lines[i].split(",")
          const line_obj = {
            id: line_arr[0],
            name: line_arr[1],
            cost: line_arr[8],
            description: line_arr[11]
          }
          const key = line_arr[0].replace(/\\/g, '').replace(/['"]+/g, '');
          line_objects[key] = line_obj
        }
        gear_data = line_objects
        cache(cache_name, line_objects)
      })
      .catch(function (error) {
        // handle error
        console.log(error);
      })
  }

  return (
    <div className="App">
      <h3>Gear Shred Checkout</h3>
      <div style={{marginTop: "-40px"}} >
        <QRReader addUserFromQR={addUserFromQR} addIdFromQR={addIdFromQR} />
      </div>
      <div style={{marginTop: "-30px"}} >
        {user.name &&
          <p style={{ fontSize: "12px", padding: "0px" }}>Checking out: {user.name}</p>
        }
        <Box style={{alignItems: 'center', justifyContent: 'center', display: 'flex'}} >
          <List
            style={{backgroundColor: "#eee",
              width: "400px", height: "180px", maxHeight: "180px", maxWidth: "90%",
              borderColor: "#ddd", borderWidth: "1px", borderStyle: "solid", borderRadius: "10px",
              overflow: 'auto'}}
          >
            <ListItem key={"title"} component="div" disablePadding>
              <ListItemButton>
                <ListItemText secondary={"Checkout List"} />
              </ListItemButton>
            </ListItem>
            {selectedArr.map((id) => (
              <ListItem key={id} component="div" disablePadding>
                <ListItemButton>
                  {
                    gear_data[id]
                    ?
                      <ListItemText primary={"Description: " + gear_data[id].description} secondary={"id: " + id + " name: " + gear_data[id].name} />
                    :
                      <ListItemText primary={"Manual: " + id} />
                  }

                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
        <Button style={{marginTop: "10px", marginRight: "10px"}} onClick={handleClickOpenManual} variant="contained" >Add Manually</Button>
        <Button style={{marginTop: "10px", marginLeft: "10px"}} onClick={handleSubmit} variant="contained">Done</Button>
      </div>
      <Dialog fullWidth open={openManual} onClose={handleCloseManual}>
        <DialogTitle>Add Manually</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Enter an item manually.
          </DialogContentText>
          <TextField
            value={manualText}
            onInput={e => setManualText(e.target.value)}
            autoFocus
            margin="dense"
            id="name"
            multiline
            label="Item"
            fullWidth
            variant="standard"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseManual}>Cancel</Button>
          <Button onClick={addItemManually}>Add</Button>
        </DialogActions>
      </Dialog>
      <Dialog fullWidth open={openOfficer} onClose={handleCloseOfficer}>
        <DialogTitle>Officer name</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Enter officer name.
          </DialogContentText>
          <TextField
            value={officerText}
            onInput={e => setOfficerText(e.target.value)}
            autoFocus
            margin="dense"
            id="name"
            multiline
            label="Item"
            fullWidth
            variant="standard"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={addOfficer}>Add</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default App;

import React, { useState } from 'react';
import { QrReader } from '@blackbox-vision/react-qr-reader';
import {getFromCache, cache, shouldUseCache} from "./Cache.js"


const QRReader = (props) => {
  const [data, setData] = useState();

  var isConfirming = false

  return (
    <>
      <QrReader
        constraints= { facingMode: 'environment' }
        onResult={(result, error) => {
          if (!!result) {
            if (!isConfirming) {
              const qr_data = result?.text;
              if (qr_data && qr_data.length > 0) {
                if (qr_data.includes("%")) {
                  const data_arr = qr_data.split("%")
                  const obj = {
                    name: data_arr[0],
                    email: data_arr[1],
                    phone: data_arr[2],
                    id: data_arr[3],
                    destination: data_arr[4],
                  }
                  props.addUserFromQR(obj)
                }
                else {
                  isConfirming = true
                  const gear_data = getFromCache("gear")
                  const key = qr_data.replace(/\\/g, '').replace(/['"]+/g, '');
                  var r = window.confirm("Adding: \n" + qr_data + "\n" + gear_data[key].name + "\n" + gear_data[key].description);
                  isConfirming = false
                  if (r == true) {
                    props.addIdFromQR(qr_data)
                  }
                }
              }
            }
          }
          if (!!error) {
//            console.info(error);
          }
        }}
        style={{ width: '100%' }}
      />
    </>
  );
};

export default QRReader;
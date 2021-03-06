import React, { useState, useEffect } from 'react';
import BN from 'bignumber.js';

import { Typography, Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

import { LoadingRing } from '@aragon/ui'
import AmountRow from './AmountRow';

import { useDebounce } from '../lib/hooks';
import { getRate } from '../lib/exchange';

import {
  INPUT_CURRENCIES as inputCurrencies,
  OUTPUT_CURRENCIES as outputCurrencies,
  // ENABLE_TOKENS,
} from '../lib/currencies';

const useStyles = makeStyles(theme => ({
  root: {
    marginTop: theme.spacing(3),
  },
  interRow: {
    height: 46,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: theme.palette.text.secondary,
  },
}));

function RateForm({ onChange, defaultRateRequest }) {
  const classes = useStyles();

  const [rateDetails, setRateDetails] = useState({
    inputCurrencyId: 0,
    inputCurrency: inputCurrencies[0],
    outputCurrencyId: 0,
    outputCurrency: outputCurrencies[0],
    inputAmount: null,
    outputAmount: 100,
    tradeExact: 'OUTPUT',
  });
  const [rateLoading, setRateLoading] = useState(true);
  const [rateRequest, setRateRequest] = useState(null);
  const [fees, setFees] = useState(null);
  const debouncedRateRequest = useDebounce(rateRequest, 1000);

  useEffect(() => {
    if(defaultRateRequest) {
      const newRateDetails = {
        inputCurrencyId: inputCurrencies.indexOf(defaultRateRequest.inputCurrency),
        inputCurrency: defaultRateRequest.inputCurrency,
        outputCurrencyId: outputCurrencies.indexOf(defaultRateRequest.outputCurrency),
        outputCurrency: defaultRateRequest.outputCurrency,
        inputAmount: defaultRateRequest.tradeExact === 'INPUT' ? defaultRateRequest.amount : null,
        outputAmount: defaultRateRequest.tradeExact === 'OUTPUT' ? defaultRateRequest.amount : null,
        tradeExact: defaultRateRequest.tradeExact,
      };
      setRateDetails(newRateDetails);
      setRateRequest({
        inputCurrency: defaultRateRequest.inputCurrency,
        outputCurrency: defaultRateRequest.outputCurrency,
        amount: defaultRateRequest.amount,
        tradeExact: defaultRateRequest.tradeExact,
      });
    } else {
      setRateRequest({
        inputCurrency: rateDetails.inputCurrency,
        outputCurrency: rateDetails.outputCurrency,
        amount: rateDetails.tradeExact === 'INPUT' ? rateDetails.inputAmount : rateDetails.outputAmount,
        tradeExact: rateDetails.tradeExact,
      });
    }
  }, [defaultRateRequest]); // eslint-disable-line react-hooks/exhaustive-deps

  let feeValue, feeCurrency, rate;
  if(!rateLoading) {
    if(fees.currency === rateDetails.inputCurrency) {
      feeValue = BN(fees.amount).times(rateDetails.outputAmount).div(rateDetails.inputAmount).dp(6).toString();
      feeCurrency = rateDetails.outputCurrency;
    } else {
      feeValue = BN(fees.amount).dp(6).toString();
      feeCurrency = fees.currency;
    }
    rate = BN(rateDetails.outputAmount).div(rateDetails.inputAmount).dp(3).toString();
  }

  useEffect(() => {
    onChange(rateRequest);
  }, [onChange, rateRequest]);

  useEffect(() => {
    let isMounted = true;

    (async () => {

      if (!debouncedRateRequest || debouncedRateRequest.amount === 0) return;

      setRateLoading(true);

      const res = await getRate(debouncedRateRequest);

      if(!isMounted) return;

      setRateDetails(r => ({
        ...r,
        inputAmount: BN(res.inputAmount).toString(),
        outputAmount: BN(res.outputAmount).toString(),
      }));

      setFees(res.fees);

      setRateLoading(false);
    })();

    return () => isMounted = false;
  }, [debouncedRateRequest]);

  function onChangeInputCurrency(currencyId) {
    setRateLoading(true);
    const newRateDetails = {
      ...rateDetails,
      inputCurrency: inputCurrencies[currencyId],
      inputCurrencyId: currencyId,
    };
    setRateDetails(newRateDetails);
    setRateRequest({
      ...rateRequest,
      inputCurrency: newRateDetails.inputCurrency,
    });
  }
  function onChangeOutputCurrency(currencyId) {
    setRateLoading(true);
    const newRateDetails = {
      ...rateDetails,
      outputCurrency: outputCurrencies[currencyId],
      outputCurrencyId: currencyId,
    };
    setRateDetails(newRateDetails);
    setRateRequest({
      ...rateRequest,
      outputCurrency: newRateDetails.outputCurrency,
    });
  }
  /*
  function onChangeInputValue(e) {
    setRateLoading(true);
    const value = Number(e.target.value);
    const newRateDetails = {
      ...rateDetails,
      inputAmount: value,
      outputAmount: null,
      tradeExact: 'INPUT',
    };
    setRateDetails(newRateDetails);
    setRateRequest({
      ...rateRequest,
      amount: newRateDetails.inputAmount,
      tradeExact: newRateDetails.tradeExact,
    });
  }
  */

  function onChangeOutputValue(e) {
    setRateLoading(true);
    const value = Number(e.target.value);
    const newRateDetails = {
      ...rateDetails,
      inputAmount: null,
      outputAmount: value,
      tradeExact: 'OUTPUT',
    };
    setRateDetails(newRateDetails);
    setRateRequest({
      ...rateRequest,
      amount: newRateDetails.outputAmount,
      tradeExact: newRateDetails.tradeExact,
    });
  }

  return (
    <Box py={1}>
      <AmountRow
        value={rateLoading ? '-' : rateDetails.inputAmount}
        currencyId={rateDetails.inputCurrencyId}
        onChangeCurrency={onChangeInputCurrency}
        currencies={inputCurrencies}
        valueDisabled
        // currencyDisabled={!ENABLE_TOKENS}
        caption="Send"
      />
      <AmountRow
        value={rateDetails.outputAmount}
        currencyId={rateDetails.outputCurrencyId}
        onChangeValue={onChangeOutputValue}
        onChangeCurrency={onChangeOutputCurrency}
        currencies={outputCurrencies}
        caption="Receive"
      />

      <Box className={classes.interRow}>
        {rate ?
          <Typography variant="caption">
            <b>Rate:</b> {rate} {rateDetails.outputCurrency}/{rateDetails.inputCurrency}
            <br/>
            <b>Fees:</b> {feeValue} {feeCurrency}
          </Typography>
          :
          <LoadingRing/>
        }
      </Box>
    </Box>
  );
}

export default RateForm;

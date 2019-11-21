import React, { useState } from 'react';
import useForm from 'react-hook-form';
import { throttle } from 'lodash';
import IBAN from 'iban';

import Divider from '@material-ui/core/Divider';
import Box from '@material-ui/core/Box';

import { Button, Field, DropDown, TextInput, Info } from '@aragon/ui'

import Bity from '../lib/bity';

// TODO
const currencies = ['EUR', 'CHF'];

function SimpleFiatForm({ address, onComplete }) {
  const [selectedCurrency, setSelectedCurrency] = useState(0);

  const { register, handleSubmit, errors, getValues } = useForm();

  const onSubmit = handleSubmit(async data => {
    console.log('submit, form values', data);

    Bity.order(address, {
      ...data,
      currency: currencies[selectedCurrency],
    })
      .then(onComplete)
      .catch(console.error);
  });

  const [amountEstimation, setAmountEstimation] = useState(null);

  const estimateInput = throttle(async () => {
    const values = getValues();
    const outputAmount = values.amount;
    const res = await Bity.estimate({
      inputCurrency: 'ETH',
      outputCurrency: currencies[selectedCurrency],
      outputAmount,
    });
    setAmountEstimation({
      inputAmount: res.inputAmount,
      outputAmount: res.outputAmount,
    });
  }, 3000, { 'trailing': false });

  const fields = {
    name: {
      required: true,
      minLength: 2,
      maxLength: 50,
      defaultValue: 'Alice Martin',
    },
    address: {
      required: true,
      minLength: 2,
      maxLength: 50,
      defaultValue: '5 Rue de Rivoli',
    },
    zip: {
      required: true,
      minLength: 2,
      maxLength: 10,
      defaultValue: '75001',
    },
    city: {
      required: true,
      minLength: 2,
      maxLength: 10,
      defaultValue: 'Paris',
    },
    country: {
      required: true,
      minLength: 2,
      maxLength: 2,
      defaultValue: 'FR',
    },
    iban: {
      required: true,
      validate: IBAN.isValid,
      defaultValue: 'FR7630004000031234567890143',
    },
    bic_swift: {
      required: true,
      pattern: /^[A-Z]{6}[A-Z2-9][A-NP-Z0-9]([A-Z0-9]{3}){0,1}/,
      defaultValue: 'BNPAFRPP',
    },
    reference: {
      pattern: /[0-9A-Za-z ]*/,
      defaultValue: 'FR7630004000031234567890143',
    },
    amount: {
      required: true,
      min: 0,
      pattern: /^[0-9]+\.?[0-9]*$/,
      defaultValue: 100,
      validate: value => Number(value) > 0,
    },
  };

  return (
    <Box width={1}>
      <form onSubmit={onSubmit}>
        <Box>
          <Box size="large" smallcaps>Recipient</Box>
          <Box>
            <Field label="IBAN">
              <TextInput wide name="iban" ref={register(fields.iban)} defaultValue={fields.iban.defaultValue} required/>
              {errors.iban && <Box>Invalid IBAN</Box>}
            </Field>
            <Field label="BIC/SWIFT">
              <TextInput wide name="bic_swift" ref={register(fields.bic_swift)} defaultValue={fields.bic_swift.defaultValue} required/>
              {errors.bic_swift && <Box>Invalid BIC</Box>}
            </Field>
            <Field label="Name">
              <TextInput wide name="owner.name" ref={register(fields.name)} defaultValue={fields.name.defaultValue} required/>
              {errors['owner.name'] && <Box>Please enter your name</Box>}
            </Field>
            <Field label="Address">
              <TextInput wide name="owner.address" ref={register(fields.address)} defaultValue={fields.address.defaultValue} required/>
              {errors['owner.address'] && <Box>Invalid address</Box>}
            </Field>
            <Field label="Zip/Postal code">
              <TextInput wide name="owner.zip" ref={register(fields.zip)}  defaultValue={fields.zip.defaultValue} required/>
              {errors['owner.zip'] && <Box>Invalid Zip/Code</Box>}
            </Field>
            <Field label="City">
              <TextInput wide name="owner.city" ref={register(fields.city)}  defaultValue={fields.city.defaultValue} required/>
              {errors['owner.city'] && <Box>Invalid city</Box>}
            </Field>
            <Field label="Country">
              <TextInput wide name="owner.country" ref={register(fields.country)}  defaultValue={fields.country.defaultValue} required/>
              {errors['owner.country'] && <Box>Invalid country</Box>}
            </Field>
          </Box>
        </Box>
        <Divider variant="middle" />
        <Box size="large" smallcaps>Payment details</Box>
        <Box>
          <Field label="Amount">
            <TextInput.Number wide name="amount" defaultValue={fields.amount.defaultValue} ref={register(fields.amount)} onChange={estimateInput} required/>
            {errors.amount && <Box>Invalid amount</Box>}
          </Field>
          <Field label="Reference">
            <TextInput.Number wide name="reference" ref={register(fields.reference)} />
            {errors.reference && <Box>Invalid reference, please only use regular letters and numbers</Box>}
          </Field>
          <Field label="Currency">
            <DropDown
              items={currencies}
              active={selectedCurrency}
              onChange={setSelectedCurrency}
            />
          </Field>
          {amountEstimation &&
          <Info title="Exchange rate">
            <Box>{amountEstimation.inputAmount}ETH => {amountEstimation.outputAmount} {currencies[selectedCurrency]}</Box>
          </Info>
          }
        </Box>
        <Divider variant="middle" />
        <Button mode="strong" wide onClick={onSubmit}>Send</Button>
      </form>
    </Box>
  )
}

/*
        <Box>
          Send funds to
        </Box>
        <TabBar
          items={['Me', 'Existing contact', 'New contact']}
          selected={contactType}
          onChange={setContactType}
        />
        {
          contactType === 0 &&
          <Info title="My information">
            <b>Name:</b> {accountInformation.name} <br/>
            <b>IBAN:</b> {accountInformation.iban}
          </Info>
        }
        {
          contactType === 1 &&
          <DropDown
            items={contacts}
            active={selectedContact}
            onChange={setSelectedContact}
          />
        }{
        contactType === 2 &&
        <div>
          <Field label="Name">
            <TextInput wide value={contactName} onChange={e => setContactName(e.target.value)}/>
          </Field>
          <Field label="IBAN">
            <TextInput wide/>
          </Field>
        </div>
      }
 */

export default SimpleFiatForm;

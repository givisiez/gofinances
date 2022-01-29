import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  TouchableWithoutFeedback, 
  Keyboard,
  Alert 
} from 'react-native';
import * as Yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import AsyncStorage  from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';

import { useForm } from 'react-hook-form';

import { InputForm } from '../../components/Form/InputForm';
import { Button } from '../../components/Form/Button';
import { TransactionTypeButton } from '../../components/Form/TransactionTypeButton';
import { CategorySelectButton } from '../../components/Form/CategorySelectButton';

import { CategorySelect } from '../CategorySelect';

import {
  Container,
  Header,
  Title,
  Form,
  Fields,
  TransationsTypes
} from './styles';

export type FormData = {
  [name: string]: any;
  //amount: string,
}


const schema = Yup.object().shape({
  name: Yup
  .string()
  .required('Nome é obrigatório'),
  amount: Yup
  .number()
  .typeError('Informe um valor numérico')
  .positive('O valor não pode ser negativo')
  // .required('O valor é obrigatório')
});

export function Register({navigation} : {navigation: any}) {
  const dataKey = '@gofinances:transactions';

  const [transactionType, setTransactionType] = useState('');
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);

  const [category, setCategory] = useState({
    key: 'category',
    name: 'Categoria'
  });

  const { 
    control, 
    handleSubmit,
    reset,
    formState: { errors } 
  } = useForm({
    resolver: yupResolver(schema)
  });

  function handleTransactionTypeSelect(type: 'positive' | 'negative') {
    setTransactionType(type);
  }

  function handleOpenSelectCategoryModal() {
    setCategoryModalOpen(true);
  }

  function handleCloseSelectCategoryModal() {
    setCategoryModalOpen(false);
  }

  async function handleRegister(form: FormData){
    if(!transactionType) {
      return Alert.alert("Obrigatório","Selecione o tipo da transação");
    }

    if(category.key === 'category') {
      return Alert.alert("Obrigatório","Selecione a categoria");
    }    

    const newTransaction = {
      id: String(uuid.v4()),
      name: form.name,
      amount: form.amount,
      type: transactionType,
      category: category.key,
      date: new Date()
    }    

    try {      
      const data = await AsyncStorage.getItem(dataKey);
      const currentData = data ? JSON.parse(data) : [];

      const dataFormatted = [
        ...currentData,
        newTransaction
      ];
      
      await AsyncStorage.setItem(dataKey, JSON.stringify(dataFormatted));  

      reset();
      setTransactionType('');
      setCategory({
        key: 'category',
        name: 'Categoria'
      });

      navigation.navigate('Listagem');

    } catch (err) {
      console.log(err);
      Alert.alert("Ooops!","Não foi opssível salvar, tente novamente.");
    }

  }

  useEffect(() => {
    async function loadData() {
      const data = await AsyncStorage.getItem(dataKey);
      console.log(JSON.parse(data!));
    }    

    loadData();
    
    // async function resetAllSorage() {
    //   await AsyncStorage.removeItem(dataKey);
    // }
    // resetAllSorage();
  },[]);

  return(
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <Container>      
        <Header>
          <Title>Cadastro</Title>
        </Header>

        <Form>
          <Fields>
            <InputForm
              name="name"
              control={control}
              placeholder="Nome"
              autoCapitalize="sentences"
              autoCorrect={false}  
              error={ errors.name && errors.name.message}         
            />
            <InputForm
              name="amount"
              control={control}
              placeholder="Preço"
              keyboardType="numeric"
              error={ errors.amount && errors.amount.message}  
            />

            <TransationsTypes>
              <TransactionTypeButton
                type="up"
                title="Income"
                onPress={() => handleTransactionTypeSelect('positive')}
                isActive={ transactionType === 'positive'}
              />
              <TransactionTypeButton
                type="down"
                title="Outcome"
                onPress={() => handleTransactionTypeSelect('negative')}
                isActive={ transactionType === 'negative'}
              />
            </TransationsTypes>

            <CategorySelectButton 
              title={category.name}
              onPress={handleOpenSelectCategoryModal}
            />
          </Fields>

          <Button 
            title="Enviar"
            onPress={handleSubmit(handleRegister)}
          />
        </Form>

        <Modal visible = {categoryModalOpen}>
          <CategorySelect 
            category={category}
            setCategory={setCategory}
            closeSelectCategory={handleCloseSelectCategoryModal}
          />
        </Modal>      
      </Container>
    </TouchableWithoutFeedback>
  );
}
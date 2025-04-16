import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the Clarity contract environment
const mockTxSender = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
const mockBlockHeight = 100;

// Mock contract state
let contractState = {
  'contract-owner': mockTxSender,
  'next-property-id': 1,
  'properties': {}
};

// Mock contract functions
const mockContractFunctions = {
  'register-property': (address, squareFootage, buildingType, constructionYear, baselineEnergyUsage) => {
    const propertyId = contractState['next-property-id'];
    
    // Check if property already exists
    if (contractState.properties[propertyId]) {
      return { type: 'err', value: 101 }; // ERR-PROPERTY-EXISTS
    }
    
    // Add property to state
    contractState.properties[propertyId] = {
      owner: mockTxSender,
      address,
      'square-footage': squareFootage,
      'building-type': buildingType,
      'construction-year': constructionYear,
      'baseline-energy-usage': baselineEnergyUsage,
      'registration-date': mockBlockHeight
    };
    
    // Increment property ID
    contractState['next-property-id'] += 1;
    
    return { type: 'ok', value: propertyId };
  },
  
  'update-property': (propertyId, squareFootage, baselineEnergyUsage) => {
    // Check if property exists
    if (!contractState.properties[propertyId]) {
      return { type: 'err', value: 102 }; // ERR-PROPERTY-NOT-FOUND
    }
    
    // Check if caller is owner
    if (contractState.properties[propertyId].owner !== mockTxSender) {
      return { type: 'err', value: 100 }; // ERR-NOT-AUTHORIZED
    }
    
    // Update property
    contractState.properties[propertyId]['square-footage'] = squareFootage;
    contractState.properties[propertyId]['baseline-energy-usage'] = baselineEnergyUsage;
    
    return { type: 'ok', value: true };
  },
  
  'get-property': (propertyId) => {
    if (!contractState.properties[propertyId]) {
      return { type: 'none' };
    }
    return { type: 'some', value: contractState.properties[propertyId] };
  },
  
  'is-property-owner': (propertyId, caller) => {
    if (!contractState.properties[propertyId]) {
      return false;
    }
    return contractState.properties[propertyId].owner === caller;
  },
  
  'get-property-count': () => {
    return contractState['next-property-id'] - 1;
  }
};

describe('Property Registration Contract', () => {
  beforeEach(() => {
    // Reset contract state before each test
    contractState = {
      'contract-owner': mockTxSender,
      'next-property-id': 1,
      'properties': {}
    };
  });
  
  it('should register a new property', () => {
    const result = mockContractFunctions['register-property'](
        '123 Main St',
        50000,
        'Office',
        2005,
        100000
    );
    
    expect(result.type).toBe('ok');
    expect(result.value).toBe(1);
    expect(contractState['next-property-id']).toBe(2);
    expect(contractState.properties[1]).toBeDefined();
    expect(contractState.properties[1].address).toBe('123 Main St');
  });
  
  it('should update an existing property', () => {
    // First register a property
    mockContractFunctions['register-property'](
        '123 Main St',
        50000,
        'Office',
        2005,
        100000
    );
    
    // Then update it
    const result = mockContractFunctions['update-property'](1, 55000, 95000);
    
    expect(result.type).toBe('ok');
    expect(result.value).toBe(true);
    expect(contractState.properties[1]['square-footage']).toBe(55000);
    expect(contractState.properties[1]['baseline-energy-usage']).toBe(95000);
  });
  
  it('should fail to update a non-existent property', () => {
    const result = mockContractFunctions['update-property'](999, 55000, 95000);
    
    expect(result.type).toBe('err');
    expect(result.value).toBe(102); // ERR-PROPERTY-NOT-FOUND
  });
  
  it('should get property details', () => {
    // First register a property
    mockContractFunctions['register-property'](
        '123 Main St',
        50000,
        'Office',
        2005,
        100000
    );
    
    const result = mockContractFunctions['get-property'](1);
    
    expect(result.type).toBe('some');
    expect(result.value.address).toBe('123 Main St');
    expect(result.value['building-type']).toBe('Office');
  });
  
  it('should check if a principal is the property owner', () => {
    // First register a property
    mockContractFunctions['register-property'](
        '123 Main St',
        50000,
        'Office',
        2005,
        100000
    );
    
    const result = mockContractFunctions['is-property-owner'](1, mockTxSender);
    
    expect(result).toBe(true);
    
    const resultNonOwner = mockContractFunctions['is-property-owner'](1, 'ST2PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM');
    
    expect(resultNonOwner).toBe(false);
  });
  
  it('should get the property count', () => {
    expect(mockContractFunctions['get-property-count']()).toBe(0);
    
    // Register two properties
    mockContractFunctions['register-property'](
        '123 Main St',
        50000,
        'Office',
        2005,
        100000
    );
    
    mockContractFunctions['register-property'](
        '456 Oak Ave',
        75000,
        'Retail',
        2010,
        150000
    );
    
    expect(mockContractFunctions['get-property-count']()).toBe(2);
  });
});

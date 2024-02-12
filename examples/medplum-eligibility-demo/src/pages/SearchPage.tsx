import { Filter, formatSearchQuery, Operator, parseSearchDefinition, SearchRequest, SortRule } from '@medplum/core';
import { Document, Loading, SearchControl, useMedplum } from '@medplum/react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export function SearchPage(): JSX.Element {
  const medplum = useMedplum();
  const location = useLocation();
  const navigate = useNavigate();

  const [search, setSearch] = useState<SearchRequest>();

  useEffect(() => {
    const parsedSearch = parseSearchDefinition(location.pathname + location.search);
    if (!parsedSearch.resourceType) {
      navigate('/Coverage');
      return;
    }

    const populatedSearch = getPopulatedSearch(parsedSearch);
    console.log(populatedSearch);

    if (
      location.pathname === `/${populatedSearch.resourceType}` &&
      location.search === formatSearchQuery(populatedSearch)
    ) {
      setSearch(populatedSearch);
    } else {
      navigate(`/${populatedSearch.resourceType}${formatSearchQuery(populatedSearch)}`);
    }
  }, [medplum, navigate, location]);

  if (!search?.resourceType || !search.fields || search.fields.length === 0) {
    return <Loading />;
  }

  return (
    <Document>
      <SearchControl search={search} />
    </Document>
  );
}

function getPopulatedSearch(search: SearchRequest): SearchRequest {
  const fields = search.fields ?? getDefaultFields(search.resourceType);
  const sortRules = search.sortRules ?? [{ code: '-_lastUpdated' }];
  const filters = search.filters ?? getDefaultFilters(search.resourceType);

  const populatedSearch: SearchRequest = {
    ...search,
    fields,
    sortRules,
    filters,
  };
  return populatedSearch;
}

function getDefaultFilters(resourceType: string): Filter[] {
  if (resourceType === 'Coverage') {
    return [{ code: 'status', operator: Operator.EQUALS, value: 'active' }];
  } else {
    return [];
  }
}

function getDefaultFields(resourceType: string): string[] {
  const fields = [];

  switch (resourceType) {
    case 'Coverage':
      fields.push('beneficiary', 'relationship', 'payor', 'type');
      break;
    case 'Patient':
      fields.push('name', 'birthdate', 'gender');
      break;
    default:
      fields.push('id');
  }

  return fields;
}

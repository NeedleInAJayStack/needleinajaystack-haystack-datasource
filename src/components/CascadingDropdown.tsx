import { DataSource } from 'datasource';
import React, { useState, useEffect } from 'react';
import { HaystackQuery } from 'types';

type Props = {
  datasource: DataSource | null;
  query: HaystackQuery;
};

interface CascadingDropdownOption {
  label: string;
  value: string;
  items: CascadingDropdownOption[];
}

const CascadingDropdown = ({ datasource, query }: Props) => {
  const [options, setOptions] = useState(new Array<CascadingDropdownOption>());
  const [selectedLevel, setSelectedLevel] = useState('');
  // const [subLevels, setSubLevels] = useState([]);
  const [subLevels] = useState([]);

  useEffect(() => {
    fetchRoot().then((options) => {
      setOptions(options);
    });
  }, []);

  useEffect(() => {
    if (selectedLevel) {
      // Fetch sub-levels data based on the selected level
      fetchSubLevels(selectedLevel);
    }
  }, [selectedLevel]);

  async function fetchRoot(): Promise<CascadingDropdownOption[]> {
    try {
      // Make an API call to fetch levels data
      let response = await datasource?.nav(undefined, query.refId);
      let options: CascadingDropdownOption[] = response?.map((item: string) => {
        return {
          label: item,
          value: item,
          items: []
        }
      }) ?? [];
      return options;
    } catch (error) {
      console.error('Error fetching levels:', error);
      return [];
    }
  };

  const fetchSubLevels = async (level: string) => {
    try {
      // Make an API call to fetch sub-levels data based on the selected level
      await datasource?.nav(level, query.refId);

      // const response = await fetch(`/api/sub-levels?level=${level}`);
      // const data = await response.json();

      // Set the fetched sub-levels
      // setSubLevels(data.subLevels);
    } catch (error) {
      console.error('Error fetching sub-levels:', error);
    }
  };

  const handleLevelChange = (event: { target: { value: React.SetStateAction<string>; }; }) => {
    setSelectedLevel(event.target.value);
  };

  return (
    <div>
      <label htmlFor="level">Select Level:</label>
      <select id="level" value={selectedLevel} onChange={handleLevelChange}>
        <option value="">-- Select --</option>
        {options.map((option) => (
          <option key={option.label} value={option.value} >
            {option.label}
          </option>
        ))}
      </select>

      <label htmlFor="subLevel">Select Sub-Level:</label>
      <select id="subLevel">
        <option value="">-- Select --</option>
        {subLevels.map((subLevel) => (
          <option key={subLevel} value={subLevel}>
            {subLevel}
          </option>
        ))}
      </select>
    </div>
  );
};

export default CascadingDropdown;
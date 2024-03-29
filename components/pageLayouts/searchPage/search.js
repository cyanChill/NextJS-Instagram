import { useState, useEffect, useMemo } from "react";

import { debounce } from "../../../lib/debounce";
import FormInput from "../../formElements/formInput";
import User from "../../users/userList/user";
import classes from "./search.module.css";

const Search = () => {
  const [initialRender, setInitalRender] = useState(true);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const sendSearchRequest = useMemo(() => {
    return debounce(async (searchQuery) => {
      const res = await fetch(`/api/search/${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (res.ok) {
        setSearchResults(data.users);
      } else {
        console.log(data.message);
      }
    }, 500);
  }, []);

  useEffect(() => {
    if (query.trim().length > 3) {
      sendSearchRequest(query);
      setInitalRender(false);
    } else {
      setSearchResults([]);
    }
  }, [query, sendSearchRequest]);

  return (
    <div className={classes.wrapper}>
      {/* Search Bar */}
      <header>
        <FormInput
          type="text"
          placeholder="🔍Search"
          minLength="8"
          required
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </header>

      {/* Search Results */}
      <div>
        {(searchResults.length === 0 || query.trim().length < 8) &&
          !initialRender && (
            <p className={classes.noResult}>No Results Found</p>
          )}
        {searchResults.length > 0 &&
          query.trim().length >= 8 &&
          searchResults.map((user) => <User key={user._id} user={user} />)}
      </div>
    </div>
  );
};

export default Search;

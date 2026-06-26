const fs = require('fs');
let code = fs.readFileSync('src/pages/Admin.jsx', 'utf8');

// The end of the file got messed up, let's fix it manually by targeting the known string
const target = `              <div className="toggle on" onClick={(e) => e.currentTarget.classList.toggle('on')}>

        </div>
      </div>
    </div>
  );
};

export default Admin;
`;

const replacement = `              <div className="toggle on" onClick={(e) => e.currentTarget.classList.toggle('on')}></div>
            </div>
          </div>
        </div>
      </div>
      )}
        </div>
      </div>
    </div>
  );
};

export default Admin;
`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/pages/Admin.jsx', code);
  console.log('Fixed end of Admin.jsx');
} else {
  console.log('Target string not found, trying fallback');
  // Try fallback logic
  let parts = code.split('<div className="toggle on" onClick={(e) => e.currentTarget.classList.toggle(\'on\')}>');
  if(parts.length > 1) {
      let head = parts.slice(0, parts.length - 1).join('<div className="toggle on" onClick={(e) => e.currentTarget.classList.toggle(\'on\')}>');
      let newEnd = `</div>
            </div>
          </div>
        </div>
      </div>
      )}
        </div>
      </div>
    </div>
  );
};

export default Admin;
`;
      fs.writeFileSync('src/pages/Admin.jsx', head + '<div className="toggle on" onClick={(e) => e.currentTarget.classList.toggle(\'on\')}>' + newEnd);
      console.log('Fixed using fallback');
  } else {
      console.error('Could not find injection point');
  }
}

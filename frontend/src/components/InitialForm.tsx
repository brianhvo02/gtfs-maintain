import { FormEvent, useState } from 'react';
import './InitialForm.scss';
import { useCookies } from 'react-cookie';
import { isDevelopment } from '../utils';

const InitialForm = () => {
    const [mdbUri, setMdbUri] = useState(''); 
    const [, setCookie] = useCookies();

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setCookie('mdbUri', mdbUri, {
            secure: !isDevelopment,
            expires: new Date(new Date().getTime() + 2592000000),
            sameSite: 'strict'
        });
    }

    return (
        <form className='connect-form' onSubmit={handleSubmit}>
            <label>
                <p>Connect to MongoDB database:</p>
                <input 
                    value={mdbUri}
                    onChange={e => setMdbUri(e.target.value)} 
                    placeholder='mongodb+srv://username:password@cluster0-jtpxd.mongodb.net/admin'
                />
            </label>
            <button>Connect</button>
        </form>
    );
}

export default InitialForm;
import { Dispatch, FormEvent, SetStateAction, useEffect, useMemo, useRef, useState } from 'react';
import './NewFeedForm.scss';
import useWebSocket from 'react-use-websocket';
import { v4 } from 'uuid';
import { Feed } from '../../../shared';

const NewFeedForm = ({ setCurrentFeed, setFeeds }: { 
    setCurrentFeed: Dispatch<SetStateAction<Feed | undefined>>
    setFeeds: Dispatch<SetStateAction<Feed[] | undefined>>
}) => {
    const id = useMemo(() => v4(), []);
    const [name, setName] = useState('');
    const [url, setUrl] = useState('');
    const [clicked, setClicked] = useState(false);
    const [messages, setMessages] = useState<string[]>([]);
    const messageContainerRef = useRef<HTMLUListElement>(null);

    const { lastMessage } = useWebSocket('ws://localhost:5000', {
		protocols: id
	});

    useEffect(() => {
        setMessages(prev => [...prev, lastMessage?.data]);
    }, [lastMessage]);

    useEffect(() => {
        if (messageContainerRef.current) {
            const { scrollHeight, clientHeight } = messageContainerRef.current;
            messageContainerRef.current.scrollTop = scrollHeight - clientHeight;
        }
    }, [messages]);

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setClicked(true);
        fetch('/feeds', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id, name, url })
        }).then(async res => {
            const feed = await res.json();
            console.log(feed)
            setFeeds(prev => [...(prev ?? []), feed]);
            setCurrentFeed(feed);
        });
    }

    return (
        <form className='feed-form' onSubmit={handleSubmit}>
            <h1>Add GTFS feed</h1>
            <ul ref={messageContainerRef}>
                {
                    messages.map((message, i) => <li key={i}>{message}</li>)
                }
            </ul>
            <label>
                <p>GTFS feed name:</p>
                <input 
                    value={name}
                    disabled={clicked}
                    onChange={e => setName(e.target.value)} 
                    placeholder='New York Subway'
                />
            </label>
            <label>
                <p>Link to GTFS feed:</p>
                <input 
                    value={url}
                    disabled={clicked}
                    onChange={e => setUrl(e.target.value)} 
                    placeholder='http://web.mta.info/developers/data/nyct/subway/google_transit.zip'
                />
            </label>
            <button disabled={clicked}>Add feed</button>
        </form>
    );
}

export default NewFeedForm;
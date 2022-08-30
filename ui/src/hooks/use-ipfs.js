/*

export default function useIpfs (ipfs, cmd, opts) {
  const [res, setRes] = useState(null)
  useEffect(() => {
    callIpfs(ipfs, cmd, setRes, opts)
  }, [ipfs, cmd, opts])
  return res
}

async function callIpfs (ipfs, cmd, setRes, ...opts) {
  if (!ipfs) return null
  console.log(`Call ipfs.${cmd}`)
  const ipfsCmd = getProperty(ipfs, cmd)
  const res = await ipfsCmd(...opts)
  console.log(`Result ipfs.${cmd}`, res)
  setRes(res)
}
*/

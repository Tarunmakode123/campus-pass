import { jsPDF } from 'jspdf';
import type { LeaveRequest } from '../context/DatabaseContext';

const FACULTY_SIG_BASE64 = "data:image/png;base64,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";
const HOD_SIG_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAf0AAAGbCAYAAADOYUnPAAAuAUlEQVR4nO3dP1AcyZLA4X4XzxAmEe2AyXM6xHmsh56HPOl5rCfWQ560Hu0t6408IU94izzhPeQJ75C34x2KcQ7vkDNxY4J5kUS2ordU1V39d7qnfl+EYrUSGnpmmsmqrKysv0VRFMVJuhdF0W4URWuR26OCvwtR0WtVJtTX8n7ZF7AC+rp3QnmvQv1ZHNpnYlfuln0BQ/O3OEmfRVF0sewLAQAA3fqPKIp2Ov4eAABgIEF/iCkZAADQQdAHAAABIOgDABAIgj4AAIEg6AMAEAiCPgAAgSDoAwAQUNCnIxUAAAFgpg8AQCAI+gAABOLvDf7tNIqihS4PZIdzrOf+f6GHHcifiW/6+zujC2D2//nHMQ9JWMs9Tv7v7o3HuzOu5c7yddlyRvb7Nb3WKPfvsmuv0q3wUYXDSlxfm11Pdt3ZdeWfU/7rooLXZN3yvBeW18D890XPIf96ms/DJn8t2fO6N+6T/LVkr3vR45nvX/69y792+edm+1rzOT4q+D75+8pH0euSvQdFf28+R9s1F30P28/RmuXeMV+r7M/WLNcSOV7n/P+7HifP9r6bj5V9jc9hKea/r8K8PtfrkZfdQ9k9bf5Z/t/dG/d8EfN1zr/35n1bdo1l8tdtfi5Gxr1e5XOwymdg/jkV3cvmvZjFgux1df3b/M9J/rMwKogfRfdd3dfb9drln4/5uK7vtVbj9c/H4PsmQX86n01+qvlvAQDAiNL7ty1fBwAAGGjQ55AeAAACCfpl61MAAGBgqN4HACAQdYN+3WpZAACwJMz0AQAIRN2gb9s3CgAABoyZPgAAgWCmDwBAINiyBwBAIGjOAwBAIFjTBwAgEOzTBwAgEKT3AQAIBOl9AAACQdAHACAQrOkDABCIukH/W8vXAQAABhr0H7V8HQAAoGN05AMAIBBs2QMAIBBU7wMAEAjW9AEACAQzfQAAAlE36N+3fB0AAKBjzPQBAAgEHfkAAAgEW/YAAAgE6X0AAAJB0AcAIBC04QUAIBAU8gEAEAj26QMAEAjS+wAABKJu0F+0fB0AAKBjHLgDAEAg2LIHAEAg6MgHAEAgSO8DABAI0vsAAASC6n0AAAJBcx4AAAJBeh8AgEAQ9AEACATV+wAABII1fQAAAkF6HwCAQNQN+nctXwcAAOgYM30AAAJB730AAALBTB8AgEAQ9AEACARBHwCAQBD0AQAIBEEfAIBAEPQBAAgEQR8AgEDUDfrrLV8HAADoGDN9AAACQe99AAACwdG6AAAEom7Qf9TydQAAgIEG/UXL1wEAADpGIR8AAIFgyx4AAIFgpg8AQCAI+gAABIKgDwBAIAj6AAAEom7QX2v5OgAAQMdowwsAQCBowwsAQCBowwsAQCBY0wcAIBDM9AEACAQH7gAAEAj26QMAEAiCPgAAgSDoAwAQCII+AACBIOgDABAI9ukDABAItuwBABCIukF/veXrAAAAHeOUPQAAAsEpewAABILqfQAAAkHQBwAgEAR9AAACQdAHACAQdYP+o5avAwAAdIyZPgAAgSDoAwAQCII+AACBoPc+AACBoCMfAACBIL0PAEAgOHAHAIBA1A36ay1fBwAA6BjNeQAACARr+gAABIKgDwBAIFjTBwAgEMz0AQAIBEEfAIBAUL0PAEAgmOkDABAIeu8DABAI0vsAAASC9D4AAIEgvQ8AQCCY6QMAEAjW9AEACARteAEACETdoH/X8nUAAICOMdMHACAQzPQBAAgE1fsAAASCffoAAASC9D4AAIEgvQ8AQCCo3gcAIBDM9AEACARteAEACAQzfQAAAsGaPgAAgWDLHgAAgSC9DwBAIAj6AAAEgqAPAEAgCPoAAASC6n0AAAJB9T4AAIHgaF0AAAJBG14AAAJBIR8AAIGoG/QXLV8HAADoGDN9AAACQdAHACAQBH0AAAJB0AcAIBAEfQAAAkEbXgAAAsGWPQAAAkHvfQAAAlE36K+3fB0AAKBjpPcBAAgE1fsAAASC9D4AAIGoG/TvW74OAADQMdL7AAAEgi17AAAEgo58AAAEgvQ+AACBIOgDABAIgj4AAIEg6AMAEIi6Qf9Ry9cBAAA6xkwfAIBAEPQBAAgEbXgBAAgEM30AAAJBG14AAAJBG14AAALBlj0AAAJBIR8AAIFgTR8AgEBQvQ8AQCAo5AMAIBDM9AEACARr+gAABKJu0F+0fB0AAKBjrOkDABAI1vQBAAgEHfkAAAgE6X0AAAJBeh8AgEAQ9AEACARBHwCAQBD0AQAIBEEfAIBAEPQBAAgE+/QBAAgEM30AAAJRN+jft3wdAACgYxytCwBAIJjpAwAQiLpBf73l6wAAAB2jeh8AgECQ3gcAIBAU8gEAEAhm+gAABIJCPgAAAkFHPgAAAkHQBwAgEKT3AQAIBDN9AAACwZY9AAACwUwfAIBAEPQBAAgEQR8AgEAQ9AEACARBHwCAQNB7HwCAQNCcBwCAQLBPHwCAQNQN+ouWrwMAAAw06K+1fB0AAKBjrOkDABAI1vQBAAgEW/YAAAgEzXkAAAgEQR8AgEDUDfqPWr4OAADQMWb6AAAEgqAPAEAgCPoAAASCoA8AQCDYpw8AQCCY6QMAEAiCPgAAgSDoAwAQCII+AACBqBv0b1u+DgAA0LG/1/x3ay1fB9CLOEn3oijaj6JoEUXR+Xw2mS77mgBg6EF/o+XrADoXJ+lWFEVHURRJ4BdHcZKmURSdzWeTb0u+PAxInKTPdHJzOZ9NZIAIBJ3eZ6aPMdrKBfzMJIqiK/2QByTgH0ZRdBFF0ccoiv47TlIOGEMUetC/a/k6gD7sFAwGDuIkXe/5ejAwGuBf5P5oM4qiJ0u8JKBVVO8jJEVBXVK4BH3sWII86X2sDII+QnLt+PPzKIqkoI8P95HOzlvM0kiRZ94pxZ5YJQR9hMQV1C+0mI+gP87dGPL+/U+cpL81fCxZ5nltLGOeNL9KYDgI+giJLahPtUKbQ6RGJk7SV1EUfdbiTJnpH8dJKrsz6pICvjzZ0vm14WUCK7FlDxgj266TC7brjaK4bkffv2t5v7TC3jYLn8RJelE1WOe2c+adNrtyYHhozoOQyAe7ifXa4ZN19jP9/XWcpF8ss/I8mflXnaHvGv+/mM8m8n2AlUIbXgQhTtIdYytWhln+8B3nfr9dEvDFTpXCPv1a8zGvql0iMA6k9xHSbNHciiWFWgxgG6Tdq9ZC6OBLGiFJoL2JouhDUQGlfr0tQxOVzPSla6hvYeZby73xqeL3BFY66LOfGWOr8LbN8iUosFRVQ5yku9rQSP732KcuQtfmJ0ZXRAnqvxT8MynWK3NjDAw29Vdpil8r/g8sf8VMHyupbnqfrU0YvDhJH2s193sNAjacI1FRnKQburXtUH899/ynzy1tkGXgsFMwSLAFZLPHwoFu2yvab297/BfG0kG+zkMGEsDKqRv0meljDLP7M51ZutLDMhO8H1IwlQA45HbAGvBPfIKqR7FcxvV8fV6Hcy24+2D8+aFHpkIGgzZs4cTKonoffQcMuXduu/xQjZN0Xw9LMdfvzfv2oqBLX29y28UOcxXqHwZ6+l/dgB8VZFusZ3no1jwzde/afXFp/oUMoGzd9HRQNXF8jt012aqnj/1MCw6n89lEMhHAYHDgDnrvnCb3T5yk/xsn6XtXarfm99iKk/StJeBf6rpxtu0ru4eny57R5SrH8zPT7T5P/5P3Rt+LP3QG7Pq6HUfA910icT120cAm/57ZZuQPaXgtBjRT8uZSQmZScIjOr9lj1hxs/qnXLIO4j3GSyvcCRh/0SX2h6gxfCqZ2jFmfBLo/NeBstDComBhtVPNrvpdGLcr9smtTdIZ/6CgyFPL3F3GSymu0V+FxH1UMVP/W65DX6aTgvXA97pbn4MY106+bVTQHBMdlRYC6jn9YsFRwWqPv/768RzrYNF+LI47mxZDQhhd9sJ1clicfwrdVZ7U6s38RJ+lHbcdqzkLfRFH0UtLEOhPMB3kJQktbO9cg/m8dqGx6vH6fy2aNWg/wXjMEMpBa92hj+9EIrI8LBvWLupMAy+tfOmiQQkxLl7y8v6Tu57PJByMLuZnPXOjr58ocVO6zr4/9WV9DV8ZKugMyScLo1/RJ76MK3/PIZVZ7qbPz61yQWNfAkAWHLQ2Uu46ZoASDN5b1VDPoSBq9965r2kL2bY3aGJk1Skr7siCbklXSSxCStP0Tsy5Ag+mBI6DeuPbNS2vbOEmvHP0OfFw4qvHlen54Tvr+OB/L0Wr3gzGTP4uT9ECvuWgAIWl9r3tBB6cHHrUN8lqlbfU4ANrAPn10SoORz17rjMyAvVPZhoXO1uQ4VNs68doyt+tpmvfIsU3Mx01BM6F1y9a5LZ31/ywFbbn6gaKMQVl6+6sl6PsGr0+OoC/X/c7y50Xvj22QkF3/ofkalFzXiU9aX2f2RfUAmXMddE4dAwZ5vrs6wP2d0x3RJzryoWt7Pez2uNVUfmF3N0vArLPG3ESTgC+DGZnlf604EJegJzUBF/r7otlz1GXmQzIvjkyBZCQ2LAO1adXr1MHNZYWBo7ymv3oMXI8s9SImufcO5rPJJ8/H2NafjZee1wo0RtBH18oCq3ywP/IIRt8r7nOd1ha5o3F9ZktLm1FpSr9uwL/VAU1RECyrOPdtoFP2Gt01zPy9dGyT3Ddn+5Juj5N06lgvL7rOY8+gLwOQnwuKLF/odW17vD+ntgyTPs6uBnzb40hNSspsH30h6GPZ5MPy3Ciu29DBggQY+TD8pv+9a7hv/UYfZ73P2pSSRjC2ALJZNajrnnZZP266RazsNflimfFWeR1vNOibAVB2DcgWyu8z+JIdHUUV8V+1YK+om9+ZruMvHGcDHJVkqOR9ktd7amZfcnv1Dz2WAuR+profvSHoo2tlH2jPcuupXc92FkbQ7zy9rwHgtUcgPM1dmxm4va5zPpu80V74PoH/TANOvrjt1mNQdelodOSraOYs9QcvdQa+rdfmqoov661/mft+5rVKCv6D8R7tajak7AS/bKnlTcUCSefAYYANmLDC6gZ9blL4Kgvkz+VDt6f0prlN71GXVdS5A2aKqrxPtfPel9zs1tYEZ9fn5DcN/JI5sfWVl2Aq6fIvOtte06/LBhWl74G8T3qefT59/qTsddTX4rXHgMQ3I1J4jVrF/yFO0l/1tZPX9F6XgqZ6PYd6TVVO8TvQ/fz3lpn9icdSx3m2O6WgPgMYXNAnHQVfPsFcPij7CPpZQ57sg3nRccDPt9a1ze7faPCdGmn6a0vQf+573Kt0lIuT9NSYVb+2FTrqmvlmxbV5873KBilm//vse+w61tklLfGoZq2DV9c8fb7yun3S4CyHML31yL64vudXHSzd63u8p+9zWRpfnuM71u6xbPTeR9eKis8yj3s61ezOWH/uJGNVEOTyqXUJyg8zPc+Bx16Nn9EsmN8VFDvmX/d1jxl7Nms2yX54GUR9H5ho1uLAMbt/PZ9NHgr34iT9ZGlFnLGt/0cFWxdd172vfQx8CkbFQmfkN7ltpDc6o5emUDsejyXXPtQzFBAoZvrolDZ0OSmZWe35zmIbuu9yHV8Dy6uSWd8P6WHPQXWVFHT29dnMXQYXPkFnLZvFFgT8o4JrkeZKZ7qenvUEsAXG5/nBge5KeBkn6bF+/V2+eFOzHPnzFF76Zmg0OE8qDprSfKDWbIhcy77H4zwM6Hwb/QB9o5APfTgtCfp97pdfb7M5T4VKbece7grfq0r9wU5BhiNv3WepRXvW+7QMPiipmn9q6ygoNMjaBieyv/+pBlyvk+u0qC5bsy8jWQO5pk/6+De5AUNWzV+25VFeX2mC1MfgFeg96NM+Em3P9vvwqGZ74B/o/us9DSw+JwVmM2AfrgAt39O3+EuCXmatYLCwbvkeNx5dBOVrLvQ13PEMrL+4An4Z/XeXHgMwmY2/8Hxv5Tl9yj3fhyJK7amwXyG7cqFV+BTmYWUP3CG9j0q065m1D7lW0XfeEldnkvk1bFmbzQfHUhJY9LCc9/prxzOIf6kwS3el4r2OIdbg95e0etnhOznmoUf7joD/s76nT7UgsYgM+P5ZN+B7nnT3So9tfu8R8OV6fprPJtICd5pbirjWZYSiJYw8eT4v9bUg4GMUSO+jN7qd7EKDSL46fVMDWh+p0VvjA9179qwDhGwvd5U1dilYqxLwbB3rogrFjhvGwPymQnr/tVT+a3bmmeNUuuOsO6AWB6Zxkr7JndCXDeAeBlldVaxrjcGeLif4vB+pvg9yD6zp89vRDNR6hffmYdsdgR5jRPU+eqXB5MII+vkT9Lq2VvMs+D1NGz93rAfvOda7bzVAVAl81mBSoThsx3ielwVZBltW4aMWr9nW5qUpzQ9b8/T59VK8pvUFrra2Npfao2Ch71M2eFv3/LcyyKEwDyuBmT6WwZyx9nm2/Z3vAFaXHPZLGrhIAMyqu23r25LWn9a4xnw/AW9afPY8d73yvYu+/7mlJ8C2I6CeNjg/oBEdeGWV+GXLHFf6vGTwlG0bPK44k7/RwRJb7bBS6gb9XnqWY2XJB2r+IBWZTfX14WoeDbuRr4rXwrWdXBq/KPAusuCgwWJhCUhVA37k+p6Ok+hMWRHa9wZARYMOPfmurE+9ONMZb29FvDroyrJAPn3ss33x2fLI4wod9yQj87vPEbvAmFG9j95p17kLHTx+zdqS9vTtp5aZ/rY0ltF2rQcFe7EXud7z97nZ4ENPf30MU53n5cp8OOsedLCSVa5nzny2t81nk1/iJDX78EfGvvjTnoP9E4+eB3lyP33RAH9UIUuSHfh01eeABlgW0vtYCqmcjpNUZmWLnluTmt/rsQbKvYI14hut+P6U7eF2WG+wTS/PdR3WpYhc57tDcy3f9xvOZxMpxrvKrZVnae4fWve2Ta9/W9+LPc9jgOWa5Hpv9N8+r3B88FVfzw0YGtL7WJqSANqXJ47ZZLYP/WF/uOcs0AzKZZ33fpA7f91rq6x+ve1QnywgetPGMr02l8ntiNj33JKYnUiY7cLwqdy/0yD/Rd/LIdx3wFIw00doNjy3dp3XCA7mTL9OcCnayWDuvZev+2z5+js93GWQRWi5TnfZljvfjox3jqOHXSQ787D9sMHlAiuFLXsIRq6LnsuFznSrbrGrvDPAcX0Pp8BpELyxBPMd4xjiiWOAkPqs5fcpl8HY90zDZzsYNi1nA7hkXfumXTUCAsaOmT6CoLPLI0fAWeiWroddBA3WeW197H2vL+sK90Jn9NlWu3zK++G0tzhJs74AZko/0mr9h9PrBvja267XlB01vFWhiE/S/SfM6IFyrOlj5WnntZOCtPmZR5Gej1q9BrTy/tBIW0913dpc5/6oGQnb4EUCn6vVcW/0+WRdFvc9g31ZjwCbN5q+Z40e8MSWPawsnT2/0IBf5KajwFF6RoX28X9h7JO/1IHIN0eLWFvAv/Togd9HUV6Wgah9mJHnaXjZVkkAPQT9vrqnAU1m90eewaet4GEWzhUWqMVJOrHsjf/LiW3SB79g/7yZ1v+2xGB/4HmdWQrfdza/0EEbve6BFpDex0rJ7VmfWGaJmx0XppqNeHal2525bU+L2o40pW8G/F+NrMOJRzA9rtn5r7bceQTZzN5nIpC9Bz4BXwoR5bXjfHqgRcz0sTK0YOw3S/r7TFPfaxqkJh0NYs0lggMNxu+MdP5vlgxE1gb2xtK98Kcoiv6wBMsrTXd/7WMgroFeBiw7Fc6s9818XOk++of/kroHukHQx0rQFLPtfPtzI5hOdaZtzrLb8EWDbz5zcBIn6WvNAmw5ZrlX2urWdbqeDBz+M7e/PRskTLPv1WULWc2ePNe2uL5peR/ymvzO+jzQHwr5MHoaDG0BP9vKZc7AzVR4K8f6SuCKk/R3SyahqOFOqhXopUFPg39vafwOg/2V1iCQugdGEvQZlWPpclvdzJPUphpIfQ+J8Wn/6mU+m7yJk3TXowHNQ7X90JrIaKDPttqVnbxXhWQmTnVrZK/1BwCaB/3SrUhAD+vLR5Yit4cCsJLDZmo30fExn03+FSfp54Luf6+H1EBHB097HQT6G30/pPKeQA8MAGv6GB2djb42Av6dFutN9eS++wqD1tYzV/PZ5GmcpC90xi/1Bve5ADiIZjK59P2kxZ/pa53Ryzo9W+yAgaENL0ZFZ6VmwBcfdHZ/41FzYv59J/vb57OJXJP8GpTcyXZVzp13WeTOspcz6Qn0wIAR9DE2x5aAv9Bf954NamR9OajlKl0OybbatZHCP9ciSQn2AEaCoI/R0HS5rVHNjf4ym+P4aqV6f+DNil5VOMK2yIUWSVJ5D4wQQR+joBXxMsu3eWhSU2Gvuvl12xIch3r+fIOZ/TPd3dC0D/5UZ/ZTTeGzZRcYKbbsYSzr+EcFM/KvFYvjblaxrbSu1W/XONkusrweHzRz8lAnQaAHVgPNeTAGOwX73mUAWnWvuxnkp2Od5Wtb3yzINy3Kk1qHd9rzfpSvB4BipPcxBkVr7nXOUzcfbxBb6KrQVsKvdCdDU2eavqfnPbDiaM6DMXheVFRW4/HMYsDpSJY4sna+TzTgNzkd8KFroc7qydwBgSC9jzEU8O07gpacO19plh4n6TNLYdu3EazVZ8fYlrX3LZMOqUEQgHEE/ZUofMIouPaUn9dsBGMG/MuhzvRz6/V7LWwrzA4fonkOEDDW9DH0Peb7LT6e7Ujdk6GtY2t246Dh8b9ZBf7FmAsVAbSLoI8hWyuoSH8RJ6kE7CpLTS+MxzsZSpMZHZBkp/PVHegstChPnhP76QH8gKCPIStKaW/rQTG/VkiVm819lnrSXZykshXxmQb5JufV32h9g1TgA4ATQR9j9jpO0rRsRqvp8rfGH79cVjGbVuIftHC63YXWNgzuUB8Aw8TRuhgy82Ac1734rSRtfmzMpGWgUGerX2O6e+CoYWtcivIA1EIbXgyWBLU4SRclg8xtV9DXQkDZzy6p/YzsS38T9UivY09n9/lrqXNO/Se22wHoO+g3aQoCVHFeUsW+Z2vDqzP8I+Pfnuo+9V5oHcGeXkPd7NhCu+5JsGewDaAR1vQxdG9Kgv6rOEllXXuaO11uV/9NvpHNm/lskva0Xr+ngbrurD7SgYwMUi6owgfQFprzYNAklR0n6c9RFH0syDq9jZNUAqQER5nhm133TgqO5W27B8CLBufWX+mOAtlXTwofQOuY6WPwZCtanKQvoyh67/iSJxpos0C5rkWAX7PDZLqYLWt73OwEwCZNhE714KBBdgYEsDpY08coSLV9nKRTnU2b6f5F7tetzpgl4F+2vQ6u6ft9vYYmFfg3unQh18isHkAvmOljNHQm/DJO0mNdL9/UpaYs4H/LAn9HM3tbcWAVV7pW/9Dvn7V6AH1jnz5GR/vI99KQRgsDd3ItcuX3VUlNwQfS9wCWjZk+4N5bf6CFeXVb5BLsAQwKQR+wz+6PdNtdFVJP8EXT93LgDR3zAAwKQR/40aFHwL/TxkEyi5fgfkNBHoChI+gD/jUr1zqLf5jN0yEPQChBX7YtAavqTO9x2R2w0Nn8VGfzBHoAo8U+fcCga/G/Lvs6AKBt/9HhkacAAGAFgj5NRQAACCToAwCAQII+hXwAAAQS9KlgBgAgkKBP9T4AACNDeh8AgEAw0wcAIBBU7wMAEIi6QV8OGwEAACPCTB8AgEAQ9AEACETdoP+t5esAAAAdY6YPAEAg2KcPAEAg2KcPAEAgSO8DABAI9ukDABAIZvoAAASCNX0AAAJB9T4AAIGoG/TvW74OAADQMdb0AQAIBEEfAIBAsKYPAEAgqN4HACAQNOcBACAQrOkDABAI0vsAAASC9D4AAIFgpg8AQCD+XvPfMdMPUJyk67pdczGfTejKCACBBH0+8AMTJ6kE+8MoivYl8MdJ+imKopP5bPKtxe+xFUWR/LqdzyZf23pcrMRgc0cHnJt6j8ifTaMoOp/PJotlXyMwFsz04es4iqKj3P9vR1G0EUXRL208eJykz6Iomujjyv+/mc8maRQQHfRs6PJZ0AOfOEk3dIC5o4F+z/Gl7+MkfTqfTS57vkRglJjpw5fM8k0HcZK+m88mMuNqGuyOsoCvjvTPD1Z9KSFO0l19/s+NP5cZ7GkURRfz2eRLFIg4Sff19ZCA7+N9FEX/6PiygJVA9T5KxUm6o+lUG98P5iIyq3ti+XP58H8drbA4SV9EUXRlBny1rsHvKk7S/9JsyMqKk/RxnKQfoyj6WPG+ksEhgA5n+ghL0QfwbQuPX7QbZBIn6VUXM12tU8gHjEWbNQqeM/wzzy+XQdGTOElPoih60+d19ji7l2Bfx3nLlwOsrLpBX9bYEI6ioN9HEdXnOEn/0XLR4JEuWfxllhgnqSxVZL+uulpX1+I0CeBVSeZjL07Sn1dhzV8HXgeaorcNKOV9kPf9Rn+/q/UlmWvj/wF0EPQ5ZS8sRenTNtbbbz0yARLsKhf2xUkqBWASYK8lSGqwfauBxjXA+T7I6XBm/ZtjMJVqgJOfsT3HdUrtw59xkv6zaT3FMmmmY+JY2pHCvDc6qJTlxG9SpR8n6bU+f8kMXOh74zX40RoRyeZQ7Y9g/S1O0rc11k2lsOhfHV0TBkSD5OeC2f5PbQSeOEn/KAjEGZnt33g+3oamzveMNPCdx/cxHc9nk98r/puia5PX8k/LX8na/r+yoKSv/b4GRltNhXzd9thS/freHBV87sh79Mt8NjkveP0ey8DA97nr55y871O9L85XvUAUsOHAHTTVVtbnncfXfNR0sI8dyzav/RoBXxzqrLQtErBspvlZqPx+Ppuc6kzYNtipu0SwNPo6fnYE/Et9PrJ04Vynl0HmfDb5UCHgZz0m1vWeOHbsRgFWHkEfhTQI3RTMyFqZLWm2IPUI5L5ZKUn5tpX6Xje2Eza1XaWgUdPXTzUTYNofS1W/7lS4sDz/ax2MPZ/PJr/OZxNp/NQandHn7wUZBKxVGEACUehBnzWxsLiC/n3BVr46zjy2g04qfFjbgmQdEoyfabq9Eb121+PI97DWT+iyhjRCsjWhORxJdf6Z5bkfayr/Q8fp9pe6vCOvnyzVnI01vS/3IQMW1MWBO2gS9NsM+JGma31mebY97bYUujmjvMt98J/rrPNKMwzPdbZ5XfA9G6f4NdA8KtgV49wpoYH/pe3adJ18yF5Z/kwaL/3eRzGiZEvms8nPmk04HWMdRJykMuD9vyiK5Ne1FqkClVC9Dx93BRmfNvbp50kAkFlhU2br1mud4V0UzfD0TIFsO585qJHr+tRhev9NWXZCAr+0KDZaImfX5lMX0TsdkJgV+qfL2F8/xtm9Bve3xn2zpVtZN8c2gME4Z/qj+8FBI66+DBLw2/7A8Vk6cs3GiwYqMrsrrdjW4rlU19DN/d+2rWWVaPreNps/1V0CPq+nZChMbQyUumJbspBiPD5HSmi9xueCgaI5+AM6Cfptz+4wbM7UcQd7nssCuu/3MwNKpcGJppzPjaWNLWkVGzXjypJ5H1es3QnN1+lJC9fWFdtr/6rlHRFDaCEsuzx+k8ZPbaTeNeDbBnh5r3ULI+CFNX34cH2obLZR3FaRBP1FT0tS8n2mNeoJ6jQ6ki57Va5RMgNR25mILmgtgpnK39YzBd4v4R5qTZykMnj5Xx2Evdfs0ERT7+8rPM66Y6eDD9b20XnQH+0PKWqlo/sMJmVb4yQt7DNr321poHpt2SK33kHQ36n4On8Z2cEzrloFqZ34n7FsOzQq6P9L+wq4lr8Oy2bh+jhv9TX4t7wO2iLadibDpQ46zaWrUb12GGfQp5AvHEXv9XrTAWA2u9UPvxfanrbIhedAxdzGVic7II9zbwR+15q8r6LX63HDHRVDruBflLwmFxrsup6Vy2mF0uSpaaB0tQ+uKutMuK4B/UIf25bZkaZFnyxZniEv7WBgOGUPTdxVDO6b+uEmgfOxfsjJOvlDsxSPh5H++R88vm7L8niVgr5e074G+K+5DIRc/zPHfvmmtiu+9rcjOvzqUpdKigZMsiXtcZV++r70cY9yr5dkbJ7OZ5PK76Os3Xv2Rrgs2o6og9MjzyyJFHkuclkes0lVdp8CnQR9qm7DsVZyH8j+YfkwkiB5r4eiPNIAtqsfRvJBu9VC+vldzTXO7IS2qs87S7nfWPbFy/7yOtmDorMDNipen/lz6HUuwTLIkkycpM/19czuD1vAk14JB3GSvp7PJm1uQVyzDJDkPrmsMXiwzcRtTloYNF9ZDny6GdnSDgaEmT6ayA6E+b4erQOA7O/a5pPa37DMws6qBmgdvLg+UJvsXmkzQ3A3lqAvNHB9L+iLk/RcA79tu+GJVsC31bzH9v7XuUf3jX93pzNsWwZju4W+DrLV9JPHkht1VvDCmj6ihrOR18baZuN1/oLUvk8B37bl+9f94HWlS7/U3aqoz8G1LbHqY66PKeg7Ds6RLnk/ORr1PNcjhGUdfr+F+/iu7vJUjhncU0s/h4xs3yv6rLwvuYYrxz1oy7SybQ9eOHAHXW2Rc6U7n+R+/aT/faq//4ejzWx2HT4eV1lXrWHRQic523Y7V0W+y9aI1vN9g7/rBES5Rz5q8K8b3O4twbLK6+0aaH0rWO5c8xgAF93XXxx/f23JNkkxH5MxlCK9jzL3+gFTZ/Z+rR9cl2Xtb42U7wtLZbTvmuVWi+l0W4CZtjCIcH3QV1k2sO3NHnU7VinSjJM0O+/e9to/0Zn/Sz1yuIotyz3s09mx7DWWDETd+6Ho8CVptSwdJH/I3sjPUZykDx0cjb9aH/s9gO4x00chTWOXfZBcaypS1txPdcb2j/ls8p/z2eSlT/tb4/t9cjQC2qlReNgk5W0rrGsj6+FKVVd57EPLezD60y+1av9JyRHK0tDHt5guYwuudXo3TC3vpQxSbW5KlqS2HddwrsV7RYOJLnaPIABU78PHdUHXrxMN9PIB19Z9kRV4mR/ULzxmVW1WMU8tKfRGKVRtPevq6ve1QgW5+TzlaNrRB32h99E7PfxoXwc45vOVVrcb89lEjhv2YVs7r5O9mlY8QKmI7Wdq4Vl4ahtMyL3KTB+dzPTrFMBgvO4LPgBP9djS1gaCmtI8cfQZL9vWZgblJkWFddZ8y+y08HO1FcLMT+6D+WzyRoPqU0sthWzt+8Pz4Wz3QeX6gIr7+suWD2wNda58lgv0Z8TsckiDHpQivQ8frsApafuuGoJ8qtlnfKvFAapti2DTCvn1Fprz2B5jVJX7VciAUoKtFvt930eZC/zSxrbMWos964uWHvLKBsKbjoOXfGfr5s/eShR2olscuINCWhHsOg2ts7avup5pm1U5P9g0C2AGxNopbx3QmEGmqaJA8NazAtsscrwaS2pf3iM9iU4q8ctaLv9AZ/5XlgxQ2Yl9t20tBWnToLJZ/FnR1+j7bMs0VMlMmQO9lTm1EN0hvY8yOwUz0K57fl9UvPds27Ka9gy4NAJG09nUTUkwl9PZnIMpbVhjFvFVrWRfphOtOpfneix98Gs8Rlpj9v3V8to3+Rz7V8F7KfetFLAWDfBcP1M7Fbbe3Vo6RdKkB4VI76NM0Wxoo+P2n7YP1UXPg9GsjXBb38N12lzmiR45+8MsUAcDby2zfJ/zCJZOB4jmzgXpgf+qyuPMZ5Mvln4O8jjOe1EzISdt1UHomvrDe2X56189alxcA7vsfIo+uwwiIAR9NO29v95hUxDb9/5a8vWtFfJp+vl9m8V9ul5bFmy2dD/693StzuDeW2aIZRXiQ+LKklReW9d9+mb6fKtikPzUwXspa/Jd1n2U/SzQmQ+dbNljTT8cRQ1jmvSg92F+iEs197SkX/6NERgr36u5Q1XMrXVy0lkbqfQTz0B3JgfP6ODq0HI9J5a+7EPmul/q7vx4ZwzKygaf+x0UP9ZthVx21HApGVzoWRf5r3/m6hipmaKsk+OtZkwQGNb0UWar7KS3NrfrZTR7YDstr+qH6YsKBWbPdAvYtRFgJVg9n88mv0ct0EB94/naS0HYZ0vAkuYtv0bj0vYOA1tL3CoFkG1kqDYbvBZ3jvu3ypLZpWWZ4y91NrJUpM2MsiZaH3VA2VkhLoarbtCnOU84imakjztcQ9y2fO+NGvfmtgRy1xKEfEBqGv9PLcAy+7/Lh+Q/O5hRl54YqGyv73HBIS+DpYNDW/+FynUhWtA48Z2M6PLITQefYzttnDiYU7Wl75VlIC4FkntySJFuZ/xsaXbFUbyBovc+nDRQurrHZR8wXX14WI8qlSBd0htgahksZGe0Z+vA93rdu5bZX96JHu266HHWm+q1PXPMIg/GUrjncKpLFflllw3truecqWuR3oa+JruWan3JxnwrWfq5yN1X0vXupoWfj40GS15vjEHmqc7cq5wJcG4ZSElWqOxUQlmqontfgOoGfU5zCoAe7HFXsi7e5gl2PrP6sszCqab0bQHT3OrmcqZtbbvscmd73SRl/1CYp9X7zzQoyGvxyaMf++DJgC1OUmmdm9+qt6kDtR8GM5qC3ndkCMyK+cLBmSzPxEn6Ve+hpiclRvo45s/G14qvhWS0tuuusUvg1kOqfI8elvsn7fjexoAx00eZy4LZ/ms5TKej71urWFSLm3722BoXWWZoH3QG2FWXwe/kAz5O0nya/ixfia/BfRonqVzToz6uqS9yz2iBYj6QSyZGgugil3bf8cjGRBrEvO7DKverzORL6lVs92ilQZm+r03f22PPoH+iA0dm+AEj6KPMuSPoyxGzUj3dFdesbd0zoEqv9j88Cq0udFbf1eClbOYpmYk1V6q5he1fgyT3Tpykm7rWHOlMf10HXw9bQT12OFzr8ktr750OPHb1e2/pUb8SKH3W/+V6ep9Ba8bgiWNLZxbs363qvYRqOGUPZVwzl64/QGSmblta8JqlSPoyTtKfNKV/kKs9kMFE1uL3Ytkz6JBnXfPZJI2T9Fbfoyzgy321WbCEKPfEF82MfGqz3kKXVI6MWXPR+/PIMhBeSjtkHej+ZHTQvPY43heBYU0fZRbLuAf0Q+yfuj7/RD/A5IAf7/SpftjJNjuZUUtQuetieyEaz/gliGep/fXcrpAvuQK9LANw00Vg1ULB34ys1lTvufuGByT1Qq9TXjP238OJ5jwo40qPSyX9epczm2xdu6XHGsWBNCEyB3Jxkl71OTjTgP+HUTtwpbUCVQIo9xgGjza8KHNXMNMn44PWLSEb88oI+FIj8ItHwDfvfyZDGDyCPsq41u4l5UqqHKOm6/iHxv0uM3yfmhUzyHd54iTQCoI+fGZdtmYhsj5OOhNjt28EbznPwLdI1dxJwgl3GDyCPnzYtiHJ6Xp8yGG0pE1tbstgdp+fNmggReYLg0fQhw9b21cpfmJNH6OkLXSlWj/Pdz++q8iVffAYPE7Zg291tXlADLMajNlzY8udbM2r2ljHHPTyuYiVDfpUqYbnnfGhJh+SNP3AWMm5BnVOPcwzl7cYCGNlgz5p3cDoLOiptvSUk95eLvuagBZPcaw0gNV6FrM5D+l9DB699+FN9y3T7Qujps14zIBd9YjorGtgHkEfg0chH4DQ2HadlB3u47PEWfVkR6B3BH0AobH1l9iPk7RKc507yyyfvhUYPII+gNDctVCgvG7Zs0+BMwaPoA8gNK71+yrNpsyaAAn4NKvCygZ9tqYAGKv84TpFFf1FbAGe9D4Gj5k+gNC4ivZ2GwT9W86iwBiwTx9AaB57ttWt0nefgI9RoCMfgNA0WnvXxjxmXQB79BGNwf8DSgqHFKKy/gEAAAAASUVORK5CYII=";


// Self-contained transparent base64 PNG signatures to bypass import and asset loading issues

// Helper to asynchronously load image URL to HTML Image for PDF rendering
const loadPhotoHelper = (url: string): Promise<HTMLImageElement | null> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
};

export const generateGatePassPDF = async (request: LeaveRequest): Promise<Blob> => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5' // A5 Size (148mm width x 210mm height)
  });

  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();

  // 1. Draw outer double borders for academic credentials
  doc.setDrawColor(2, 132, 199); // primary-500
  doc.setLineWidth(1.5);
  doc.rect(5, 5, width - 10, height - 10);
  
  doc.setDrawColor(15, 23, 42); // slate-900 thin inner border
  doc.setLineWidth(0.3);
  doc.rect(7, 7, width - 14, height - 14);

  // 2. Header Box
  doc.setFillColor(15, 23, 42); // Slate-900 header
  doc.rect(7.3, 7.3, width - 14.6, 24, 'F');

  // Load IIST Logo
  let logoImg: HTMLImageElement | null = null;
  try {
    logoImg = await loadPhotoHelper('/iist-logo.png');
  } catch (e) {
    console.warn("Failed to load IIST logo for PDF:", e);
  }

  if (logoImg) {
    try {
      doc.addImage(logoImg, 'PNG', 11, 11.3, 16, 16);
    } catch (e) {
      console.warn("Failed to draw logo inside PDF header:", e);
    }
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  
  const textX = logoImg ? 30 : width / 2;
  const textAlign = logoImg ? 'left' : 'center';

  doc.setFontSize(9.5);
  doc.text('INDORE INSTITUTE OF SCIENCE & TECHNOLOGY', textX, 17, { align: textAlign });
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(186, 230, 253); // sky-200
  doc.text('CAMPUS EMERGENCY LEAVE GATE PASS', textX, 24, { align: textAlign });

  // 3. Student Details Block with Prominent LARGEST Photo on left
  const photoX = 12;
  const photoY = 36;
  const photoW = 36;
  const photoH = 36;

  // Outer photo frame
  doc.setDrawColor(148, 163, 184); // slate-400
  doc.setLineWidth(0.5);
  doc.rect(photoX, photoY, photoW, photoH);

  let photoLoaded = false;
  if (request.student?.photo_url) {
    try {
      const imgElement = await loadPhotoHelper(request.student.photo_url);
      if (imgElement) {
        doc.addImage(imgElement, 'JPEG', photoX + 0.5, photoY + 0.5, photoW - 1, photoH - 1);
        photoLoaded = true;
      }
    } catch (e) {
      console.warn("Failed loading student photo for PDF, drawing placeholder.", e);
    }
  }

  // Draw vector placeholder if photo failed or not present
  if (!photoLoaded) {
    doc.setFillColor(241, 245, 249); // slate-100
    doc.rect(photoX + 0.5, photoY + 0.5, photoW - 1, photoH - 1, 'F');
    // Draw avatar head & shoulders
    doc.setFillColor(148, 163, 184); // slate-400
    doc.circle(photoX + (photoW / 2), photoY + 14, 6, 'F');
    doc.ellipse(photoX + (photoW / 2), photoY + 28, 11, 6, 'F');
  }

  // Student details on right of photo
  const detailsX = 53;
  let textY = 43;

  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('STUDENT NAME:', detailsX, textY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`${request.student?.full_name || 'N/A'}`, detailsX, textY + 4);

  textY += 11;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('ROLL NUMBER:', detailsX, textY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`${request.student?.roll_number || 'N/A'}`, detailsX, textY + 4);

  textY += 11;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('DEPARTMENT:', detailsX, textY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(`${request.student?.department || 'N/A'}`, detailsX, textY + 4);

  // 4. Leave Details Section: LARGE, BOLD, HIGH CONTRAST BLOCK (Visible at a glance)
  const detailBoxY = 78;
  const detailBoxH = 46;
  doc.setFillColor(240, 249, 255); // sky-50
  doc.setDrawColor(186, 230, 253); // sky-200
  doc.setLineWidth(0.5);
  doc.rect(10, detailBoxY, width - 20, detailBoxH, 'FD');

  let leaveTextY = detailBoxY + 8;
  
  // EMERGENCY CATEGORY
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('EMERGENCY CATEGORY:', 14, leaveTextY);
  doc.setFontSize(12);
  doc.setTextColor(2, 132, 199); // sky-600
  doc.text(`${request.reason_category.toUpperCase()}`, 14, leaveTextY + 5.5);

  leaveTextY += 13;
  // DATE OF LEAVE
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('DATE OF LEAVE:', 14, leaveTextY);
  doc.setFontSize(12);
  doc.text(`${request.requested_date}`, 14, leaveTextY + 5.5);

  // APPROVED TIME WINDOW (Very large and high contrast)
  leaveTextY += 13;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('APPROVED EXIT/RETURN WINDOW:', 14, leaveTextY);
  doc.setFontSize(14);
  doc.setTextColor(220, 38, 38); // Red-600 for absolute contrast
  doc.text(`${request.time_out}  TO  ${request.time_expected_back || 'END OF DAY (NO RETURN)'}`, 14, leaveTextY + 6);

  // 5. Dual Signatures Section (Side by side for trust)
  const sigsY = 132;
  
  // Faculty signature block (Left) - Clean & transparent layout
  doc.setTextColor(100, 116, 139); // slate-500
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('VERIFIED & RECOMMENDED BY', 14, sigsY + 5);
  // Add Faculty Sig image directly (transparent background)
  try {
    doc.addImage(FACULTY_SIG_BASE64, 'PNG', 16, sigsY + 7, 34, 13);
  } catch (e) {
    console.warn("Failed to add faculty signature image to PDF, using text fallback", e);
    doc.setTextColor(2, 132, 199); // sky-600
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('[VERIFIED DIGITALLY]', 16, sigsY + 14);
  }
  // Faculty text
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('Mr. Sharma', 14, sigsY + 28);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Faculty Advisor', 14, sigsY + 32);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`(Confirmed Parent: ${request.faculty_confirmed_parent ? 'YES' : 'NO'})`, 14, sigsY + 35.5);

  // HOD signature block (Right) - Clean & transparent layout
  const hodSigX = 14 + (width - 24) / 2;
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('APPROVED & SIGNED BY', hodSigX, sigsY + 5);
  // Add HOD Sig image directly (transparent background)
  try {
    doc.addImage(HOD_SIG_BASE64, 'PNG', hodSigX + 2, sigsY + 7, 34, 13);
  } catch (e) {
    console.warn("Failed to add HOD signature image to PDF, using text fallback", e);
    doc.setTextColor(2, 132, 199); // sky-600
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('[APPROVED DIGITALLY]', hodSigX + 2, sigsY + 14);
  }
  // HOD text
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('Dr. Rao', hodSigX, sigsY + 28);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('HOD, Computer Science', hodSigX, sigsY + 32);

  // 6. Verification Footer (Below signatures)
  const footerY = 182;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(10, footerY - 4, width - 10, footerY - 4);

  // Pass ID small but readable
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`PASS ID: ${request.pass_id || 'PENDING'}`, width / 2, footerY, { align: 'center' });
  
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Verifiable via Admin Office.', width / 2, footerY + 4.5, { align: 'center' });

  // System warning footer
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.5);
  doc.text('This permit is a secure digital record. Alteration is a severe academic offense.', width / 2, footerY + 11, { align: 'center' });

  // Output as Blob
  return doc.output('blob');
};
